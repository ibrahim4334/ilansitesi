import { CalendarDays } from "lucide-react";
import type { ItineraryDay } from "@/lib/types";

interface TourItineraryProps {
  itinerary: ItineraryDay[];
}

export function TourItinerary({ itinerary }: TourItineraryProps) {
  if (!itinerary.length) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground lg:text-3xl">Günlük Program</h2>
      <div className="mt-8 space-y-5">
        {itinerary.map((day) => (
          <div
            key={day.day}
            className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-5">
              {/* Day Badge */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary">
                <span className="text-xl font-bold text-primary-foreground">{day.day}</span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-lg font-medium text-muted-foreground">{day.day}. Gün</span>
                </div>
                <h3 className="mt-2 text-xl font-semibold text-foreground lg:text-2xl">{day.title}</h3>
                <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                  {day.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
