import { TourCard } from "@/components/tour-card";
import { getTours } from "@/lib/api";
import type { TourFilters } from "@/lib/types";
import { ToursPagination } from "@/components/tours-pagination";

interface ToursGridProps {
  filters: TourFilters;
}

export async function ToursGrid({ filters }: ToursGridProps) {
  const { tours, total, totalPages } = await getTours(filters);

  if (!tours.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-8 py-20 text-center">
        <div className="mx-auto max-w-md">
          <h3 className="text-2xl font-semibold text-foreground lg:text-3xl">Tur Bulunamadı</h3>
          <p className="mt-4 text-lg text-muted-foreground lg:text-xl">
            Aradığınız kriterlere uygun tur bulunamadı. Filtreleri değiştirerek tekrar deneyin veya daha sonra tekrar kontrol edin.
          </p>
        </div>
      </div>
    );
  }

  const currentPage = filters.page || 1;

  return (
    <div>
      {/* Results Count */}
      <div className="mb-8">
        <p className="text-lg text-muted-foreground lg:text-xl">
          <span className="font-semibold text-foreground">{total}</span> tur içinden{" "}
          <span className="font-semibold text-foreground">{tours.length}</span> tanesi gösteriliyor
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <ToursPagination
          currentPage={currentPage}
          totalPages={totalPages}
          filters={filters}
        />
      )}
    </div>
  );
}
