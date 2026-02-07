import { Suspense } from "react";
import type { Metadata } from "next";
import { ToursFilter } from "@/components/tours-filter";
import { ToursGrid } from "@/components/tours-grid";
import { ToursGridSkeleton } from "@/components/tours-grid-skeleton";
import type { TourFilters } from "@/lib/types";

export const metadata: Metadata = {
  title: "Umre Turları",
  description:
    "Güvenilir acentelerden Umre tur paketlerini inceleyin ve karşılaştırın. Size en uygun hac yolculuğunu bulun.",
  openGraph: {
    title: "Umre Turları | Umrebuldum",
    description:
      "Güvenilir acentelerden Umre tur paketlerini inceleyin ve karşılaştırın. Size en uygun hac yolculuğunu bulun.",
  },
};

interface ToursPageProps {
  searchParams: Promise<{
    city?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
}

export default async function ToursPage({ searchParams }: ToursPageProps) {
  const params = await searchParams;
  
  const filters: TourFilters = {
    city: params.city,
    minPrice: params.minPrice ? Number.parseInt(params.minPrice, 10) : undefined,
    maxPrice: params.maxPrice ? Number.parseInt(params.maxPrice, 10) : undefined,
    page: params.page ? Number.parseInt(params.page, 10) : 1,
    perPage: 12,
  };

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Umre Turları
          </h1>
          <p className="mt-4 text-xl text-muted-foreground lg:text-2xl">
            Güvenilir acentelerden en uygun Umre paketlerini bulun ve karşılaştırın
          </p>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filters */}
          <div className="w-full lg:w-72 lg:shrink-0">
            <ToursFilter
              currentCity={params.city}
              currentMinPrice={params.minPrice}
              currentMaxPrice={params.maxPrice}
            />
          </div>

          {/* Tours Grid */}
          <div className="flex-1">
            <Suspense fallback={<ToursGridSkeleton />}>
              <ToursGrid filters={filters} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
