import { Shield, CreditCard, HeadphonesIcon, Award } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Kimlik Onaylı Turlar",
    description:
      "Tüm turlarımız platformumuz tarafından kimlik doğrulaması yapılmış, lisanslı ve güvenilir acenteler tarafından düzenlenmektedir.",
  },
  {
    icon: CreditCard,
    title: "Güvenli Ödeme",
    description:
      "256-bit SSL şifreleme ile güvenli ödeme altyapısı. Kredi kartı veya havale ile kolayca ödeme yapın.",
  },
  {
    icon: HeadphonesIcon,
    title: "7/24 Destek",
    description:
      "Yolculuğunuz öncesinde, sırasında ve sonrasında size yardımcı olmak için destek ekibimiz her zaman yanınızda.",
  },
  {
    icon: Award,
    title: "Deneyimli Rehberler",
    description:
      "Her turda tecrübeli din görevlileri ve rehberler eşliğinde manevi açıdan dolu dolu bir yolculuk yaşayın.",
  },
];

export function WhyUs() {
  return (
    <section className="bg-secondary py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Neden Umrebuldum?
          </h2>
          <p className="mt-6 text-xl text-muted-foreground text-pretty lg:text-2xl">
            Umre yolculuğunuzu en güvenli ve huzurlu şekilde gerçekleştirmeniz için buradayız.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-card p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
                <feature.icon className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground lg:text-2xl">{feature.title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
