import { TourCardSkeleton } from "@/components/tour-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function ToursGridSkeleton() {
  return (
    <div>
      {/* Results Count Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-6 w-48" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <TourCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
