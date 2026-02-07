import { Skeleton } from "@/components/ui/skeleton";

export function TourDetailSkeleton() {
  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <Skeleton className="h-5 w-48" />

        {/* Gallery Skeleton */}
        <div className="mt-6">
          <Skeleton className="aspect-[16/9] w-full rounded-2xl sm:aspect-[2/1] lg:aspect-[5/2]" />
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-28 shrink-0 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Content Layout */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Title & Info */}
            <div>
              <Skeleton className="h-10 w-3/4" />
              <div className="mt-4 flex flex-wrap gap-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-36" />
              </div>
            </div>

            {/* Hotels Section */}
            <div>
              <Skeleton className="h-8 w-40" />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            </div>

            {/* Itinerary Section */}
            <div>
              <Skeleton className="h-8 w-48" />
              <div className="mt-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-96 lg:shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Price Card Skeleton */}
              <Skeleton className="h-48 rounded-2xl" />
              {/* Download Button Skeleton */}
              <Skeleton className="h-16 rounded-lg" />
              {/* Emergency Info Skeleton */}
              <Skeleton className="h-56 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
