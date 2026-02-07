import { Building2, MapPin, Star } from "lucide-react";
import type { Hotel } from "@/lib/types";

interface TourHotelsProps {
  hotels: Hotel[];
}

export function TourHotels({ hotels }: TourHotelsProps) {
  if (!hotels.length) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground lg:text-3xl">Konaklama</h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {hotels.map((hotel, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-5">
              {/* Icon */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary">
                <Building2 className="h-7 w-7 text-foreground" aria-hidden="true" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground">{hotel.name}</h3>
                
                {/* Stars */}
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: hotel.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      aria-hidden="true"
                    />
                  ))}
                  <span className="ml-2 text-base text-muted-foreground">
                    {hotel.stars} Yıldızlı Otel
                  </span>
                </div>

                {/* Location */}
                <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-base">{hotel.location}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
