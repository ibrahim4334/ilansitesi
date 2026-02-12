
import { prisma } from "@/lib/prisma";
import { PackageSystem } from "@/lib/package-system";
import { HeroSection } from "@/components/hero-section";
import { ToursGrid } from "@/components/tours-grid";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Umre Turları | UmreBuldum",
  description: "Türkiye'nin en güvenilir umre tur karşılaştırma platformu",
};

export default async function ToursPage({ searchParams }: { searchParams: any }) {
  // Read search params
  const departureCity = searchParams?.departureCity;
  const searchDate = searchParams?.date;
  const minPrice = searchParams?.minPrice;
  const maxPrice = searchParams?.maxPrice;
  const isDiyanetFilter = searchParams?.isDiyanet;

  const now = new Date();

  // Build where clause
  const where: any = {
    active: true,
    approvalStatus: 'APPROVED',
    endDate: { gte: now }
  };

  if (departureCity && departureCity !== 'all') {
    where.departureCity = { equals: departureCity, mode: 'insensitive' as any };
  }

  if (isDiyanetFilter === 'true') {
    where.guide = { isDiyanet: true };
  }

  let listings = await prisma.guideListing.findMany({
    where,
    include: {
      guide: true,
      tourDays: { orderBy: { day: 'asc' } }
    },
    orderBy: [
      { isFeatured: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  // Date range filtering
  if (searchDate) {
    listings = listings.filter(l => {
      const start = l.startDate.toISOString().split('T')[0];
      const end = l.endDate.toISOString().split('T')[0];
      return searchDate >= start && searchDate <= end;
    });
  }

  // Price filtering
  if (minPrice || maxPrice) {
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    listings = listings.filter(l => {
      const prices = [l.pricingQuad, l.pricingTriple, l.pricingDouble].filter(p => p > 0);
      const price = prices.length > 0 ? Math.min(...prices) : (l.price || 0);
      return price >= min && price <= max;
    });
  }

  // Transform to the shape expected by ToursGrid
  const enrichedListings = listings.map(l => {
    const profile = l.guide;
    const showPhone = profile ? PackageSystem.isPhoneVisible(profile) : false;

    return {
      id: l.id,
      guideId: l.guideId,
      title: l.title,
      description: l.description,
      city: l.city,
      departureCity: l.departureCity,
      meetingCity: l.meetingCity,
      extraServices: l.extraServices,
      hotelName: l.hotelName,
      airline: l.airline,
      pricing: {
        double: l.pricingDouble,
        triple: l.pricingTriple,
        quad: l.pricingQuad,
        currency: l.pricingCurrency
      },
      price: l.price,
      quota: l.quota,
      filled: l.filled,
      active: l.active,
      isFeatured: l.isFeatured,
      startDate: l.startDate.toISOString().split('T')[0],
      endDate: l.endDate.toISOString().split('T')[0],
      totalDays: l.totalDays,
      tourPlan: l.tourDays.map(d => ({
        day: d.day,
        city: d.city,
        title: d.title,
        description: d.description
      })),
      image: l.image,
      createdAt: l.createdAt.toISOString(),
      guide: profile ? {
        fullName: profile.fullName,
        city: profile.city,
        bio: profile.bio,
        phone: showPhone ? profile.phone : null,
        isDiyanet: profile.isDiyanet,
        photo: profile.photo,
        trustScore: profile.trustScore || 50,
        completedTrips: profile.completedTrips || 0,
        package: profile.package || "FREEMIUM"
      } : null
    };
  });

  return (
    <main className="min-h-screen">
      <HeroSection />
      <ToursGrid listings={enrichedListings} />
    </main>
  );
}
