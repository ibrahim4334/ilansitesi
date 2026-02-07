import React from "react"
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Umrebuldum - Güvenilir Umre Turları",
    template: "%s | Umrebuldum",
  },
  description:
    "Diyanet onaylı acentelerden güvenilir Umre turlarını keşfedin. Fiyatları karşılaştırın, yorumları okuyun ve huzurla rezervasyon yapın.",
  keywords: [
    "Umre",
    "Umre turu",
    "hac",
    "Mekke",
    "Medine",
    "Kabe",
    "İslami seyahat",
    "Türkiye Umre turları",
    "Diyanet onaylı",
  ],
  authors: [{ name: "Umrebuldum" }],
  creator: "Umrebuldum",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://umrebuldum.com",
    siteName: "Umrebuldum",
    title: "Umrebuldum - Güvenilir Umre Turları",
    description:
      "Diyanet onaylı acentelerden güvenilir Umre turlarını keşfedin. Fiyatları karşılaştırın ve huzurla rezervasyon yapın.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Umrebuldum - Güvenilir Umre Turları",
    description:
      "Diyanet onaylı acentelerden güvenilir Umre turlarını keşfedin. Fiyatları karşılaştırın ve huzurla rezervasyon yapın.",
  },
  robots: {
    index: true,
    follow: true,
  },
  generator: 'v0.app'
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { auth } from "@/lib/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("Auth failed in RootLayout:", e);
  }

  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.className} font-sans antialiased`}>
        <Providers session={session}>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
