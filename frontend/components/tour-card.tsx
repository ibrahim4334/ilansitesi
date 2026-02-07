import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TourListItem } from "@/lib/types";

interface TourCardProps {
  tour: TourListItem;
  showBadge?: boolean;
}

export function TourCard({ tour, showBadge = true }: TourCardProps) {
  // Determine badge type based on some logic (e.g., price or availability)
  const getBadge = () => {
    if (!showBadge) return null;
    const random = tour.id % 3;
    if (random === 0) return { text: "Erken Rezervasyon", color: "bg-primary" };
    if (random === 1) return { text: "Sınırlı Kontenjan", color: "bg-destructive" };
    return null;
  };

  const badge = getBadge();

  return (
    <Link href={`/tours/${tour.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={tour.featured_image || "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80"}
            alt={tour.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Badge */}
          {badge && (
            <div className={`absolute left-4 top-4 rounded-lg ${badge.color} px-4 py-2`}>
              <span className="text-base font-semibold text-primary-foreground">
                {badge.text}
              </span>
            </div>
          )}
          {/* Price Badge */}
          <div className="absolute right-4 top-4 rounded-xl bg-card/95 px-4 py-2 backdrop-blur-sm shadow-lg">
            <span className="text-2xl font-bold text-primary">
              {tour.price.toLocaleString("tr-TR")} ₺
            </span>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors lg:text-2xl">
            {tour.title}
          </h3>

          <div className="mt-5 flex flex-wrap items-center gap-5 text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-lg">{tour.departure_city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-lg">{tour.duration}</span>
            </div>
          </div>

          <div
            className={cn(
              buttonVariants({ variant: "outline" }),
              "mt-6 w-full h-14 text-lg font-semibold bg-transparent cursor-pointer"
            )}
          >
            Detaylı İncele
            <ArrowRight className="ml-2 h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
