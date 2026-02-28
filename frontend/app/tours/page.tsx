
import { prisma } from "@/lib/prisma";
import { PackageSystem } from "@/lib/package-system";
import { HeroSection } from "@/components/hero-section";
import { ToursGrid } from "@/components/tours-grid";
import { ToursSort } from "@/components/tours-sort";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Umre Turları | UmreBuldum",
  description: "Türkiye'nin en güvenilir umre tur karşılaştırma platformu",
};

export default async function ToursPage({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = await searchParams;
  // Read search params
  const departureCityId = resolvedParams?.departureCity; // This is now an ID
  const searchDate = resolvedParams?.date;
  const minDate = resolvedParams?.minDate;
  const maxDate = resolvedParams?.maxDate;
  const minPrice = resolvedParams?.minPrice;
  const maxPrice = resolvedParams?.maxPrice;
  const isIdentityVerifiedFilter = resolvedParams?.isIdentityVerified;

  const now = new Date();

  // Build where clause
  const where: any = {
    active: true,
    approvalStatus: 'APPROVED',
    endDate: { gte: now }
  };

  if (departureCityId && departureCityId !== 'all') {
    where.departureCityId = departureCityId;
  }

  if (isIdentityVerifiedFilter === 'true') {
    where.guide = { isIdentityVerified: true };
  }

  // Sorting logic
  const sortParam = resolvedParams?.sort || 'recommended';
  const orderBy: any[] = [];

  switch (sortParam) {
    case 'price_asc':
      orderBy.push({ price: 'asc' });
      break;
    case 'price_desc':
      orderBy.push({ price: 'desc' });
      break;
    case 'date_asc':
      orderBy.push({ startDate: 'asc' });
      break;
    case 'date_desc':
      orderBy.push({ startDate: 'desc' });
      break;
    case 'recommended':
    default:
      orderBy.push({ isFeatured: 'desc' });
      orderBy.push({ createdAt: 'desc' });
      break;
  }

  let listings = await prisma.guideListing.findMany({
    where,
    include: {
      guide: true,
      departureCity: true,
      airline: true,
      tourDays: { orderBy: { day: 'asc' } }
    },
    orderBy
  });

  // Date range filtering
  if (minDate || maxDate) {
    listings = listings.filter(l => {
      const lStart = l.startDate.getTime();
      // Use departureDateEnd if available, otherwise assume single day start window
      const lEnd = l.departureDateEnd ? l.departureDateEnd.getTime() : lStart;

      const searchMin = minDate ? new Date(minDate).getTime() : -Infinity;
      const searchMax = maxDate ? new Date(maxDate).getTime() : Infinity;

      // Overlap check: 
      // (StartA <= EndB) and (EndA >= StartB)
      return lStart <= searchMax && lEnd >= searchMin;
    });
  } else if (searchDate) {
    // Check if the search date falls WITHIN the tour range
    // tour.startDate <= searchDate <= tour.endDate
    listings = listings.filter(l => {
      const sDate = new Date(searchDate).getTime();
      const tStart = l.startDate.getTime();
      const tEnd = l.endDate.getTime();
      return sDate >= tStart && sDate <= tEnd;
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
    // Always show phone if requested by user logic updates
    const showPhone = profile ? true : false; // kept as per previous file logic

    return {
      id: l.id,
      guideId: l.guideId,
      title: l.title,
      description: l.description,
      city: l.city,
      departureCity: l.departureCity?.name || l.departureCityOld || "Unknown",
      meetingCity: l.meetingCity,
      extraServices: l.extraServices,
      hotelName: l.hotelName,
      airline: l.airline?.name || l.airlineOld || "Unknown",
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
        phone: profile.phone,
        isIdentityVerified: profile.isIdentityVerified,
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Bulunan Turlar ({enrichedListings.length})</h2>
          <ToursSort />
        </div>
        <ToursGrid listings={enrichedListings} />
      </div>
    </main>
  );
}
