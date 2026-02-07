import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TourCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden border-border bg-card">
      {/* Image Skeleton */}
      <Skeleton className="aspect-[4/3] w-full rounded-none" />

      {/* Content Skeleton */}
      <CardContent className="p-5">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="mt-2 h-6 w-1/2" />

        <div className="mt-4 flex items-center gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}
