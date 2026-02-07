import { TourCardSkeleton } from "@/components/tour-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function FeaturedToursSkeleton() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="mt-2 h-6 w-80" />
          </div>
          <Skeleton className="h-12 w-36" />
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TourCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
