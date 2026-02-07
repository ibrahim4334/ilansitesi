"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

interface ToursFilterProps {
  currentCity?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
}

export function ToursFilter({
  currentCity,
  currentMinPrice,
  currentMaxPrice,
}: ToursFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const [city, setCity] = useState(currentCity || "");
  const [minPrice, setMinPrice] = useState(currentMinPrice || "");
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice || "");

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (city && city !== "all") {
      params.set("city", city);
    } else {
      params.delete("city");
    }

    if (minPrice) {
      params.set("minPrice", minPrice);
    } else {
      params.delete("minPrice");
    }

    if (maxPrice) {
      params.set("maxPrice", maxPrice);
    } else {
      params.delete("maxPrice");
    }

    // Reset to page 1 when filters change
    params.delete("page");

    router.push(`/tours${params.toString() ? `?${params.toString()}` : ""}`);
    setIsOpen(false);
  }, [city, minPrice, maxPrice, router, searchParams]);

  const clearFilters = useCallback(() => {
    setCity("");
    setMinPrice("");
    setMaxPrice("");
    router.push("/tours");
    setIsOpen(false);
  }, [router]);

  const hasActiveFilters = currentCity || currentMinPrice || currentMaxPrice;

  const FilterContent = () => (
    <div className="flex flex-col gap-8">
      {/* City Filter */}
      <div className="space-y-3">
        <Label htmlFor="city" className="text-lg font-medium">
          Kalkış Şehri
        </Label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger id="city" className="h-14 text-lg">
            <SelectValue placeholder="Tüm şehirler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm şehirler</SelectItem>
            {CITIES.map((c) => (
              <SelectItem key={c} value={c.toLowerCase()}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-3">
        <Label className="text-lg font-medium">Fiyat Aralığı (₺)</Label>
        <div className="flex items-center gap-4">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-14 text-lg"
            min={0}
          />
          <span className="text-xl text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-14 text-lg"
            min={0}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 pt-4">
        <Button onClick={applyFilters} size="lg" className="h-14 text-lg font-semibold">
          Filtreleri Uygula
        </Button>
        {hasActiveFilters && (
          <Button
            onClick={clearFilters}
            variant="outline"
            size="lg"
            className="h-14 text-lg bg-transparent"
          >
            <X className="mr-2 h-5 w-5" />
            Filtreleri Temizle
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="lg" className="w-full h-14 text-lg bg-transparent">
              <Filter className="mr-3 h-6 w-6" />
              Filtrele
              {hasActiveFilters && (
                <span className="ml-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-sm">
            <SheetHeader>
              <SheetTitle className="text-2xl">Turları Filtrele</SheetTitle>
              <SheetDescription className="text-lg">
                Aradığınız turu kolayca bulun.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-8">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filter Sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-28 rounded-2xl border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">Turları Filtrele</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            Aradığınız turu kolayca bulun
          </p>
          <div className="mt-8">
            <FilterContent />
          </div>
        </div>
      </aside>
    </>
  );
}
