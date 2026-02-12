"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, MapPin, Calendar, Check, CreditCard, Building, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const CITIES = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Konya", "Adana", "Gaziantep",
];

const ROOM_TYPES = [
  { id: "2-kisilik", label: "2 Kişilik Oda" },
  { id: "3-kisilik", label: "3 Kişilik Oda" },
  { id: "4-kisilik", label: "4 Kişilik Oda" },
];

export function HeroSection() {
  const router = useRouter();
  const { data: session } = useSession();
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [roomType, setRoomType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isDiyanet, setIsDiyanet] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city && city !== "all") params.set("departureCity", city);
    if (date) params.set("date", date);
    if (roomType) params.set("roomType", roomType);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (isDiyanet) params.set("isDiyanet", "true");

    router.push(`/tours${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 w-full">
        <div className="mx-auto max-w-4xl text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-6 sm:text-5xl lg:text-6xl xl:text-7xl leading-tight drop-shadow-lg">
            Manevi Yolculuğunuzda <br /> Güvenilir Rehberiniz
          </h1>
          <p className="mt-4 text-xl text-white/90 sm:text-2xl lg:text-3xl max-w-2xl mx-auto drop-shadow-md mb-8">
            En iyi Umre turlarını karşılaştırın veya size özel teklif alın.
          </p>
          <div className="flex justify-center gap-4">
            {/* Show only if User or Not Logged In */}
            {(!session || session.user.role === 'USER') && (
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg px-8 py-6 rounded-full shadow-xl transition-all hover:scale-105 border-0 ring-offset-2 ring-amber-500/50"
                onClick={() => router.push("/request")}
              >
                ✨ Teklif Al (Hızlı)
              </Button>
            )}
            {/* Show Dashboard link for Guides/Orgs */}
            {session && (session.user.role === 'GUIDE' || session.user.role === 'ORGANIZATION') && (
              <Button
                size="lg"
                className="bg-white text-blue-900 hover:bg-gray-100 font-bold text-lg px-8 py-6 rounded-full shadow-xl transition-transform hover:scale-105"
                onClick={() => router.push("/dashboard")}
              >
                Panelime Git
              </Button>
            )}
          </div>
        </div>

        {/* Unified Search Form */}
        {mounted ? (
          <form
            onSubmit={handleSearch}
            className="mx-auto max-w-6xl rounded-3xl bg-white p-6 shadow-2xl backdrop-blur-sm/90"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Departure City (3 cols) */}
              <div className="md:col-span-3">
                <Label className="text-xs text-gray-500 font-medium ml-1 mb-1.5 block">Kalkış Yeri</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 h-5 w-5 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" />
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="h-12 w-full border-gray-200 bg-gray-50 pl-10 text-base focus:ring-amber-500">
                      <SelectValue placeholder="Kalkış Şehri" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Şehirler</SelectItem>
                      {CITIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date (3 cols) */}
              <div className="md:col-span-3">
                <Label className="text-xs text-gray-500 font-medium ml-1 mb-1.5 block">Tarih</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 h-5 w-5 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-12 w-full border-gray-200 bg-gray-50 pl-10 text-base focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Budget / Price (4 cols) */}
              <div className="md:col-span-4">
                <Label className="text-xs text-gray-500 font-medium ml-1 mb-1.5 block">Bütçe Aralığı (SAR)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Min</span>
                    <Input
                      type="number"
                      placeholder="SAR"
                      value={minPrice}
                      onChange={e => setMinPrice(e.target.value)}
                      className="h-12 pl-10 bg-gray-50 border-gray-200"
                    />
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Max</span>
                    <Input
                      type="number"
                      placeholder="SAR"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                      className="h-12 pl-10 bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>
              </div>

              {/* Button (2 cols) */}
              <div className="md:col-span-2">
                <Button type="submit" size="lg" className="h-12 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-md">
                  <Search className="w-5 h-5 mr-2" /> Ara
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mx-auto mt-12 h-32 w-full max-w-5xl rounded-3xl bg-white/20 backdrop-blur-sm shadow-xl animate-pulse" />
        )}

        {/* Stats */}
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8 text-center text-white">
          <div className="p-4 rounded-xl bg-black/30 backdrop-blur-sm">
            <p className="text-3xl font-bold sm:text-4xl text-amber-400">500+</p>
            <p className="mt-1 text-sm sm:text-base opacity-90">Aktif Tur</p>
          </div>
          <div className="p-4 rounded-xl bg-black/30 backdrop-blur-sm">
            <p className="text-3xl font-bold sm:text-4xl text-amber-400">100+</p>
            <p className="mt-1 text-sm sm:text-base opacity-90">Güvenilir Acente</p>
          </div>
          <div className="p-4 rounded-xl bg-black/30 backdrop-blur-sm">
            <p className="text-3xl font-bold sm:text-4xl text-amber-400">5K+</p>
            <p className="mt-1 text-sm sm:text-base opacity-90">Mutlu Misafir</p>
          </div>
        </div>
      </div>
    </section>
  );
}
