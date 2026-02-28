import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listing-card";
import { getFeaturedTours } from "@/lib/api";

export async function FeaturedTours() {
  const tours = await getFeaturedTours();

  if (!tours.length) {
    return null;
  }

  // Map TourListItem to ListingCard props
  const mappedTours = tours.map(tour => ({
    id: tour.id.toString(),
    title: tour.title,
    city: "Mekke & Medine", // Default destination
    departureCity: tour.departureCity || tour.departure_city,
    startDate: new Date().toISOString(), // Mock start date for now
    endDate: new Date().toISOString(), // Mock end date
    totalDays: parseInt(tour.duration) || 10,
    price: tour.price,
    guide: {
      fullName: tour.agencyName || tour.agency_name || "Acente",
      city: tour.departureCity,
      isIdentityVerified: false,
      trustScore: tour.rating ? tour.rating * 20 : 100, // 5 scale to 100
      package: "AGENCY"
    },
    isFeatured: true,
    posterImages: [tour.thumbnail]
  }));

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Öne Çıkan Turlar
            </h2>
            <p className="mt-3 text-xl text-muted-foreground lg:text-2xl">
              En çok tercih edilen Umre paketleri
            </p>
          </div>
          <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg bg-transparent">
            <Link href="/tours">
              Tüm Turları Gör
              <ArrowRight className="ml-3 h-5 w-5" />
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {mappedTours.map((tour) => (
            <ListingCard key={tour.id} listing={tour} />
          ))}
        </div>
      </div>
    </section>
  );
}
