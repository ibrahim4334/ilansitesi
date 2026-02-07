import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TourNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
        <Search className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="mt-8 text-3xl font-bold text-foreground lg:text-4xl">Tur Bulunamadı</h1>
      <p className="mt-4 max-w-md text-xl text-muted-foreground">
        Aradığınız tur bulunamadı. Tur kaldırılmış olabilir veya bağlantı hatalı olabilir.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Button asChild size="lg" className="h-14 text-lg">
          <Link href="/tours">
            <Search className="mr-3 h-5 w-5" />
            Tüm Turları Gör
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-14 text-lg bg-transparent">
          <Link href="/">
            <ArrowLeft className="mr-3 h-5 w-5" />
            Ana Sayfaya Dön
          </Link>
        </Button>
      </div>
    </div>
  );
}
