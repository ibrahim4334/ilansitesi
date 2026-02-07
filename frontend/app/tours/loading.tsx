import { ToursGridSkeleton } from "@/components/tours-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ToursLoading() {
  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-2 h-6 w-96" />
        </div>

        {/* Content Layout */}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filter Sidebar Skeleton */}
          <div className="w-full lg:w-72 lg:shrink-0">
            <div className="hidden rounded-2xl border border-border bg-card p-6 lg:block">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="mt-1 h-5 w-40" />
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <div className="flex gap-3">
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 flex-1" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-12 w-full" />
              </div>
            </div>
            {/* Mobile Filter Button Skeleton */}
            <Skeleton className="h-12 w-full lg:hidden" />
          </div>

          {/* Tours Grid Skeleton */}
          <div className="flex-1">
            <ToursGridSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
