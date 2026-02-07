import { Search, GitCompare, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "1",
    title: "Ara",
    description:
      "Kalkış şehrinizi ve tercih ettiğiniz tarihi seçerek size uygun turları listeleyin.",
  },
  {
    icon: GitCompare,
    step: "2",
    title: "Karşılaştır",
    description:
      "Farklı acentelerin turlarını fiyat, süre ve içerik açısından kolayca karşılaştırın.",
  },
  {
    icon: CalendarCheck,
    step: "3",
    title: "Rezervasyon Yap",
    description:
      "Size en uygun turu seçin ve güvenli ödeme sistemiyle hemen rezervasyonunuzu yapın.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-28 bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Nasıl Çalışır?
          </h2>
          <p className="mt-6 text-xl text-muted-foreground text-pretty lg:text-2xl">
            3 kolay adımda hayalinizdeki Umre turunu bulun
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((item, index) => (
            <div key={item.title} className="relative text-center">
              {/* Connector Line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
              
              <div className="relative inline-flex">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary">
                  <item.icon className="h-10 w-10 text-primary-foreground" aria-hidden="true" />
                </div>
                <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xl font-bold text-primary">
                  {item.step}
                </div>
              </div>
              
              <h3 className="mt-8 text-2xl font-semibold text-foreground lg:text-3xl">
                {item.title}
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground lg:text-xl">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
