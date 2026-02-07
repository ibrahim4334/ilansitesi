import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Umrebuldum ile iletişime geçin. Umre yolculuğunuzla ilgili sorularınız için buradayız.",
  openGraph: {
    title: "İletişim | Umrebuldum",
    description:
      "Umrebuldum ile iletişime geçin. Umre yolculuğunuzla ilgili sorularınız için buradayız.",
  },
};

const contactInfo = [
  {
    icon: Phone,
    title: "Telefon",
    content: "0850 123 45 67",
    href: "tel:+908501234567",
  },
  {
    icon: Mail,
    title: "E-posta",
    content: "info@umrebuldum.com",
    href: "mailto:info@umrebuldum.com",
  },
  {
    icon: MapPin,
    title: "Adres",
    content: "İstanbul, Türkiye",
    href: null,
  },
  {
    icon: Clock,
    title: "Çalışma Saatleri",
    content: "Pzt-Cmt: 09:00 - 18:00",
    href: null,
  },
];

export default function ContactPage() {
  return (
    <div className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Bize Ulaşın
          </h1>
          <p className="mt-6 text-xl text-muted-foreground text-pretty lg:text-2xl">
            Umre yolculuğunuzla ilgili sorularınız mı var? Size yardımcı olmak için buradayız. Bize ulaşın, en kısa sürede dönüş yapalım.
          </p>
        </div>

        {/* Content */}
        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          {/* Contact Form */}
          <Card className="p-2">
            <CardHeader>
              <CardTitle className="text-2xl lg:text-3xl">Mesaj Gönderin</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="text-lg">
                      Ad
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Adınız"
                      className="h-14 text-lg"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-lg">
                      Soyad
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Soyadınız"
                      className="h-14 text-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-lg">
                    E-posta
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    className="h-14 text-lg"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-lg">
                    Telefon (opsiyonel)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0500 000 00 00"
                    className="h-14 text-lg"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="message" className="text-lg">
                    Mesajınız
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Size nasıl yardımcı olabiliriz?"
                    className="min-h-[180px] resize-none text-lg"
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full h-16 text-xl font-semibold">
                  Mesaj Gönder
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-8">
            <Card className="p-2">
              <CardHeader>
                <CardTitle className="text-2xl lg:text-3xl">İletişim Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {contactInfo.map((item) => (
                  <div key={item.title} className="flex items-start gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary">
                      <item.icon className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-muted-foreground">
                        {item.title}
                      </h3>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-xl font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {item.content}
                        </a>
                      ) : (
                        <p className="text-xl font-semibold text-foreground">
                          {item.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* FAQ Link */}
            <Card className="bg-secondary border-0 p-2">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-foreground">
                  Sık Sorulan Sorular
                </h3>
                <p className="mt-4 text-lg text-muted-foreground">
                  Umre turları, rezervasyon ve daha fazlası hakkında sık sorulan sorulara göz atın.
                </p>
                <Button asChild variant="outline" size="lg" className="mt-6 h-14 text-lg bg-transparent">
                  <a href="/faq">SSS Sayfasına Git</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
