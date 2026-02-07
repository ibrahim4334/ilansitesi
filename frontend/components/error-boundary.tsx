"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("[v0] Error occurred:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="mt-8 text-2xl font-bold text-foreground lg:text-3xl">Bir Hata Oluştu</h2>
      <p className="mt-4 max-w-md text-lg text-muted-foreground lg:text-xl">
        Bu sayfa yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
      </p>
      <Button onClick={reset} size="lg" className="mt-8 h-14 text-lg">
        <RefreshCw className="mr-3 h-5 w-5" />
        Tekrar Dene
      </Button>
    </div>
  );
}
