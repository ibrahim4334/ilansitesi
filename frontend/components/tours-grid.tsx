import { ListingCard } from "@/components/listing-card";
import { db } from "@/lib/db";
import type { TourFilters } from "@/lib/types";
import { PackageSystem } from "@/lib/package-system";

interface ToursGridProps {
  filters: TourFilters;
}

export async function ToursGrid({ filters }: ToursGridProps) {
  const database = db.read();
  let listings = database.guideListings.filter(l => l.active && l.approvalStatus === 'APPROVED');
  const profiles = database.guideProfiles;

  // Filter Logic
  if (filters.city && filters.city !== "all") {
    listings = listings.filter(l => l.city.toLowerCase() === filters.city?.toLowerCase() || l.departureCity.toLowerCase() === filters.city?.toLowerCase()); // Broad city match
  }

  // Note: Min/Max price logic needs 'pricing' object check or 'price' field
  if (filters.minPrice) {
    listings = listings.filter(l => {
      const p = l.pricing?.quad || l.price || 0;
      return p >= (filters.minPrice || 0);
    });
  }
  if (filters.maxPrice) {
    listings = listings.filter(l => {
      const p = l.pricing?.quad || l.price || 0;
      return p <= (filters.maxPrice || Infinity);
    });
  }


  const total = listings.length;
  // TODO: Implement pagination if needed, for now show all or slice
  // const displayedListings = listings.slice((filters.page - 1) * filters.perPage, filters.page * filters.perPage);
  const displayedListings = listings;

  if (!displayedListings.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-8 py-20 text-center">
        <div className="mx-auto max-w-md">
          <h3 className="text-2xl font-semibold text-foreground lg:text-3xl">Tur Bulunamadı</h3>
          <p className="mt-4 text-lg text-muted-foreground lg:text-xl">
            Aradığınız kriterlere uygun tur bulunamadı.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Results Count */}
      <div className="mb-8">
        <p className="text-lg text-muted-foreground lg:text-xl">
          <span className="font-semibold text-foreground">{total}</span> tur bulundu
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {displayedListings.map((listing) => {
          const profile = profiles.find(p => p.userId === listing.guideId);
          const showPhone = profile ? PackageSystem.isPhoneVisible(profile) : false;

          const enrichedListing = {
            ...listing,
            guide: profile ? {
              fullName: profile.fullName,
              city: profile.city,
              isDiyanet: profile.isDiyanet,
              trustScore: profile.trustScore || 50,
              package: profile.package || "FREEMIUM",
            } : {
              fullName: "Unknown",
              isDiyanet: false,
              trustScore: 50,
              package: "FREEMIUM"
            }
          };

          return <ListingCard key={listing.id} listing={enrichedListing} />;
        })}
      </div>
    </div>
  );
}
