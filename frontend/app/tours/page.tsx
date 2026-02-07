import { db } from "@/lib/db";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ToursPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ToursPage({ searchParams }: ToursPageProps) {
  // 1. Read Data
  const database = db.read();
  let listings = database.guideListings.filter(l => l.approvalStatus === 'APPROVED' && l.active);

  // 2. Filter Logic (Basic implementation matching Hero)
  const city = searchParams.city as string;
  const date = searchParams.date as string;
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;

  if (city && city !== 'all') {
    listings = listings.filter(l => l.departureCity === city || l.city === city);
  }

  if (date) {
    const searchDate = new Date(date).getTime();
    listings = listings.filter(l => {
      const start = new Date(l.startDate).getTime();
      const end = new Date(l.endDate).getTime();
      return searchDate >= start && searchDate <= end;
    });
  }

  if (minPrice) {
    listings = listings.filter(l => {
      // dynamic pricing check (simple min check on base price or lowest option)
      const price = l.price || (l.pricing ? Math.min(
        Number(l.pricing.double || 99999),
        Number(l.pricing.triple || 99999),
        Number(l.pricing.quad || 99999)
      ) : 0);
      return price >= minPrice;
    });
  }

  if (maxPrice) {
    listings = listings.filter(l => {
      const price = l.price || (l.pricing ? Math.min(
        Number(l.pricing.double || 99999),
        Number(l.pricing.triple || 99999),
        Number(l.pricing.quad || 99999)
      ) : 0);
      return price <= maxPrice;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Umre Turları</h1>
            <p className="text-gray-500 mt-1">
              {listings.length} aktif tur bulundu
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ana Sayfaya Dön
            </Link>
          </Button>
        </div>

        {/* Grid */}
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(l => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
            <p className="text-lg text-gray-500">Aradığınız kriterlere uygun tur bulunamadı.</p>
            <Button variant="link" className="mt-2 text-amber-600" asChild>
              <Link href="/tours">Filtreleri Temizle</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

{/* Content Layout */ }
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
      </div >
    </div >
  );
}
