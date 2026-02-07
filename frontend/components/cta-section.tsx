import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-primary px-8 py-20 text-center sm:px-16 sm:py-28">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl text-balance">
            Manevi Yolculuğunuza Başlamaya Hazır mısınız?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-primary-foreground/85 sm:text-2xl text-pretty">
            Yüzlerce Umre turunu inceleyin ve hac yolculuğunuz için en uygun paketi bulun.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="h-16 px-10 text-xl font-semibold"
            >
              <Link href="/tours">
                Turları İncele
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-16 border-primary-foreground/30 bg-transparent px-10 text-xl font-semibold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <a href="tel:+908501234567">
                <Phone className="mr-3 h-6 w-6" />
                Bizi Arayın
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
