import { Plane, Building2, Landmark, Moon } from "lucide-react";

const itinerary = [
  {
    icon: Plane,
    day: "1. Gün",
    title: "Türkiye - Medine",
    description: "Havalimanından uçuş, Medine'ye varış ve otele transfer.",
  },
  {
    icon: Landmark,
    day: "2-4. Gün",
    title: "Medine Ziyaretleri",
    description: "Mescid-i Nebevi, Uhud Dağı, Kuba Mescidi ve tarihi mekanlar.",
  },
  {
    icon: Building2,
    day: "5-9. Gün",
    title: "Mekke Ziyaretleri",
    description: "Umre ibadetleri, Kabe tavafı, sa'y ve Mekke çevresi gezileri.",
  },
  {
    icon: Moon,
    day: "10. Gün",
    title: "Veda ve Dönüş",
    description: "Son ziyaretler ve Türkiye'ye dönüş uçuşu.",
  },
];

export function SampleItinerary() {
  return (
    <section className="py-20 sm:py-28 bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Örnek Umre Programı
          </h2>
          <p className="mt-6 text-xl text-muted-foreground text-pretty lg:text-2xl">
            10 günlük standart bir Umre programının akışı
          </p>
        </div>

        <div className="mt-16 relative">
          {/* Timeline Line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-border -translate-x-1/2" />

          <div className="space-y-12">
            {itinerary.map((item, index) => (
              <div
                key={item.day}
                className={`relative flex flex-col md:flex-row items-center gap-8 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <div className="rounded-2xl bg-secondary p-8 shadow-sm">
                    <p className="text-lg font-semibold text-primary">{item.day}</p>
                    <h3 className="mt-2 text-2xl font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-3 text-lg text-muted-foreground">{item.description}</p>
                  </div>
                </div>

                {/* Icon */}
                <div className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary shadow-lg">
                  <item.icon className="h-9 w-9 text-primary-foreground" aria-hidden="true" />
                </div>

                {/* Empty space for alternating layout */}
                <div className="hidden md:block flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
