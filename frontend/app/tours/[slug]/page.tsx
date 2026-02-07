import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, MapPin, Clock, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TourGallery } from "@/components/tour-gallery";
import { TourItinerary } from "@/components/tour-itinerary";
import { TourHotels } from "@/components/tour-hotels";
import { EmergencyInfo } from "@/components/emergency-info";
import { DownloadButton } from "@/components/download-button";
import { getTourBySlug } from "@/lib/api";

interface TourDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: TourDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);

  if (!tour) {
    return {
      title: "Tur Bulunamadı",
    };
  }

  return {
    title: tour.title,
    description: `${tour.title} - ${tour.departure_city} kalkışlı ${tour.duration} Umre turu. ${tour.agency_name} ile güvenle seyahat edin.`,
    openGraph: {
      title: `${tour.title} | Umrebuldum`,
      description: `${tour.departure_city} kalkışlı ${tour.duration} Umre turu`,
      images: tour.featured_image ? [{ url: tour.featured_image }] : undefined,
    },
  };
}

export default async function TourDetailPage({ params }: TourDetailPageProps) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);

  if (!tour) {
    notFound();
  }

  // Create gallery images array - in production, this would come from the API
  const galleryImages = tour.featured_image ? [tour.featured_image] : [];

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-lg text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">
            Ana Sayfa
          </Link>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
          <Link href="/tours" className="hover:text-foreground transition-colors">
            Turlar
          </Link>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
          <span className="text-foreground font-medium truncate max-w-[250px]">
            {tour.title}
          </span>
        </nav>

        {/* Gallery */}
        <div className="mt-8">
          <TourGallery images={galleryImages} title={tour.title} />
        </div>

        {/* Content Layout */}
        <div className="mt-10 flex flex-col gap-10 lg:flex-row">
          {/* Main Content */}
          <div className="flex-1 space-y-12">
            {/* Title & Quick Info */}
            <section>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl text-balance">
                {tour.title}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-6 text-xl text-muted-foreground">
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-primary" aria-hidden="true" />
                  <span>{tour.departure_city}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-primary" aria-hidden="true" />
                  <span>{tour.duration}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="h-6 w-6 text-primary" aria-hidden="true" />
                  <span>{tour.agency_name}</span>
                </div>
              </div>
            </section>

            {/* Hotels */}
            <TourHotels hotels={tour.hotels} />

            {/* Itinerary */}
            <TourItinerary itinerary={tour.itinerary} />
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[420px] lg:shrink-0">
            <div className="sticky top-28 space-y-8">
              {/* Price Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-primary pb-6 pt-8">
                  <CardTitle className="text-center text-primary-foreground">
                    <span className="text-lg font-normal opacity-85">Kişi başı</span>
                    <div className="mt-2 text-5xl font-bold">
                      {tour.price.toLocaleString("tr-TR")} ₺
                    </div>
                    <span className="text-lg font-normal opacity-85">itibaren</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 text-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Süre</span>
                      <span className="font-semibold text-foreground">{tour.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Kalkış</span>
                      <span className="font-semibold text-foreground">{tour.departure_city}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Acente</span>
                      <span className="font-semibold text-foreground">{tour.agency_name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Download Button */}
              <DownloadButton tourId={tour.id} tourTitle={tour.title} />

              {/* Emergency Info */}
              <EmergencyInfo
                guideName={tour.guide_name}
                guidePhone={tour.guide_phone}
                agencyName={tour.agency_name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
