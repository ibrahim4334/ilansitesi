"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CITIES = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Konya",
  "Adana",
  "Gaziantep",
];

export function HeroSection() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city && city !== "all") params.set("city", city);
    if (date) params.set("date", date);
    router.push(`/tours${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="relative overflow-hidden min-h-[85vh] flex items-center">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-foreground/70" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-card sm:text-5xl lg:text-6xl xl:text-7xl text-balance leading-tight">
            Manevi Yolculuğunuzda Güvenilir Rehberiniz
          </h1>
          <p className="mt-8 text-xl leading-relaxed text-card/90 sm:text-2xl lg:text-3xl text-pretty">
            En iyi Umre turlarını karşılaştırın, size en uygun olanı kolayca bulun.
          </p>
        </div>

        {/* Search Form */}
        {mounted ? (
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-12 max-w-3xl rounded-2xl bg-card p-4 shadow-2xl sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* City Select */}
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground z-10" />
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="h-16 border-0 bg-secondary pl-14 text-lg placeholder:text-muted-foreground focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Kalkış şehri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Şehirler</SelectItem>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c.toLowerCase()}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Input */}
              <div className="relative flex-1">
                <Calendar className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-16 border-0 bg-secondary pl-14 text-lg placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Tarih seçin"
                />
              </div>

              {/* Search Button */}
              <Button
                type="submit"
                size="lg"
                className="h-16 px-10 text-xl font-semibold sm:w-auto"
              >
                <Search className="mr-3 h-6 w-6" />
                Tur Ara
              </Button>
            </div>
          </form>
        ) : (
          <div className="mx-auto mt-12 h-32 w-full max-w-3xl rounded-2xl bg-card/20 backdrop-blur-sm shadow-xl" /> // Placeholder to prevent massive layout shift
        )}

        {/* Stats */}
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8 text-center">
          <div className="rounded-2xl bg-card/10 backdrop-blur-sm p-6">
            <p className="text-4xl font-bold text-card sm:text-5xl">500+</p>
            <p className="mt-2 text-lg text-card/80 sm:text-xl">Aktif Tur</p>
          </div>
          <div className="rounded-2xl bg-card/10 backdrop-blur-sm p-6">
            <p className="text-4xl font-bold text-card sm:text-5xl">100+</p>
            <p className="mt-2 text-lg text-card/80 sm:text-xl">Onaylı Acente</p>
          </div>
          <div className="rounded-2xl bg-card/10 backdrop-blur-sm p-6">
            <p className="text-4xl font-bold text-card sm:text-5xl">50K+</p>
            <p className="mt-2 text-lg text-card/80 sm:text-xl">Mutlu Misafir</p>
          </div>
        </div>
      </div>
    </section>
  );
}
