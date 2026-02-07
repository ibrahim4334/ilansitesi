"use client";

import { ErrorBoundary } from "@/components/error-boundary";

export default function TourDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ErrorBoundary error={error} reset={reset} />
      </div>
    </div>
  );
}
