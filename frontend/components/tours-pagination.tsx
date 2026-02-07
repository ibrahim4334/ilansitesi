"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourFilters } from "@/lib/types";

interface ToursPaginationProps {
  currentPage: number;
  totalPages: number;
  filters: TourFilters;
}

export function ToursPagination({
  currentPage,
  totalPages,
  filters,
}: ToursPaginationProps) {
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (filters.city) params.set("city", filters.city);
    if (filters.minPrice !== undefined) params.set("minPrice", filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.set("maxPrice", filters.maxPrice.toString());
    params.set("page", page.toString());
    return `/tours?${params.toString()}`;
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const delta = 2; // Pages to show on each side of current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-2"
      aria-label="Pagination"
    >
      {/* Previous Button */}
      <Button
        variant="outline"
        size="lg"
        className="gap-1 text-base bg-transparent"
        asChild
        disabled={currentPage <= 1}
      >
        {currentPage > 1 ? (
          <Link href={createPageUrl(currentPage - 1)}>
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only sm:not-sr-only">Önceki</span>
          </Link>
        ) : (
          <span>
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only sm:not-sr-only">Önceki</span>
          </span>
        )}
      </Button>

      {/* Page Numbers */}
      <div className="hidden items-center gap-2 sm:flex">
        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-lg text-muted-foreground"
              >
                ...
              </span>
            );
          }

          const isCurrentPage = page === currentPage;

          return (
            <Button
              key={page}
              variant={isCurrentPage ? "default" : "outline"}
              size="lg"
              className="min-w-[52px] h-14 text-lg"
              asChild={!isCurrentPage}
              aria-current={isCurrentPage ? "page" : undefined}
            >
              {isCurrentPage ? (
                <span>{page}</span>
              ) : (
                <Link href={createPageUrl(page)}>{page}</Link>
              )}
            </Button>
          );
        })}
      </div>

      {/* Mobile Page Indicator */}
      <span className="px-4 text-lg text-muted-foreground sm:hidden">
        Sayfa {currentPage} / {totalPages}
      </span>

      {/* Next Button */}
      <Button
        variant="outline"
        size="lg"
        className="gap-1 text-base bg-transparent"
        asChild
        disabled={currentPage >= totalPages}
      >
        {currentPage < totalPages ? (
          <Link href={createPageUrl(currentPage + 1)}>
            <span className="sr-only sm:not-sr-only">Sonraki</span>
            <ChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <span>
            <span className="sr-only sm:not-sr-only">Sonraki</span>
            <ChevronRight className="h-5 w-5" />
          </span>
        )}
      </Button>
    </nav>
  );
}
