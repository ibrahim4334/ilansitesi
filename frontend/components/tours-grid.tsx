import { ListingCard } from "@/components/listing-card";

interface ToursGridProps {
  listings: any[];
}

export function ToursGrid({ listings }: ToursGridProps) {
  const total = listings.length;

  if (!listings.length) {
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
        {listings.map((listing) => {
          return <ListingCard key={listing.id} listing={listing} />;
        })}
      </div>
    </div>
  );
}
