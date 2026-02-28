import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <span className="text-2xl font-bold text-primary-foreground">U</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-card">
                Umrebuldum
              </span>
            </Link>
            <p className="mt-6 text-lg leading-relaxed text-card/70">
              Umre yolculuğunuzda güvenilir partneriniz. En iyi acenteler ve turlarla sizi buluşturuyoruz.
            </p>
            <div className="mt-6 space-y-3">
              <a
                href="tel:+908501234567"
                className="flex items-center gap-3 text-lg text-card/70 transition-colors hover:text-card"
              >
                <Phone className="h-5 w-5" />
                0850 123 45 67
              </a>
              <a
                href="mailto:info@umrebuldum.com"
                className="flex items-center gap-3 text-lg text-card/70 transition-colors hover:text-card"
              >
                <Mail className="h-5 w-5" />
                info@umrebuldum.com
              </a>
            </div>
          </div>

          {/* Turlar */}
          <div>
            <h3 className="text-xl font-semibold text-card">Turlar</h3>
            <ul className="mt-6 space-y-4">
              <li>
                <Link
                  href="/tours"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  Tüm Turlar
                </Link>
              </li>
              <li>
                <Link
                  href="/tours?city=istanbul"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  İstanbul Kalkışlı
                </Link>
              </li>
              <li>
                <Link
                  href="/tours?city=ankara"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  Ankara Kalkışlı
                </Link>
              </li>
              <li>
                <Link
                  href="/tours?city=izmir"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  İzmir Kalkışlı
                </Link>
              </li>
            </ul>
          </div>

          {/* Destek */}
          <div>
            <h3 className="text-xl font-semibold text-card">Destek</h3>
            <ul className="mt-6 space-y-4">
              <li>
                <Link
                  href="/contact"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  İletişim
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  Sık Sorulan Sorular
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  Yardım Merkezi
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  İade ve İptal Politikası
                </Link>
              </li>
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h3 className="text-xl font-semibold text-card">Kurumsal</h3>
            <ul className="mt-6 space-y-4">
              <li>
                <Link
                  href="/about"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  Kullanım Koşulları
                </Link>
              </li>
              <li>
                <Link
                  href="/listing-terms"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  İlan Yayınlama Şartları
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link
                  href="/kvkk"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  KVKK
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  Çerez Politikası
                </Link>
              </li>
              <li>
                <Link
                  href="/consent"
                  className="text-lg text-card/70 transition-colors hover:text-card"
                >
                  Açık Rıza Metni
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 border-t border-card/20 pt-8">
          <p className="text-center text-lg text-card/60">
            © {new Date().getFullYear()} Umrebuldum. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
