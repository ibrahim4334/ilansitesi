
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, CreditCard } from "lucide-react";

interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    priceTRY: number;
}

export function CreditPackages() {
    // Hardcoded for now as they are static in DB logic too, or we could fetch them
    // matching what we seeded in db.ts
    const packages: CreditPackage[] = [
        { id: "pkg_starter", name: "Başlangıç Paketi", credits: 10, priceTRY: 299 },
        { id: "pkg_pro", name: "Pro Paket", credits: 30, priceTRY: 799 },
        { id: "pkg_agency", name: "Ajans Paketi", credits: 100, priceTRY: 1999 }
    ];

    const [loading, setLoading] = useState<string | null>(null);

    const handleBuy = async (pkg: CreditPackage) => {
        setLoading(pkg.id);
        try {
            const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageId: pkg.id })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    toast.error("Ödeme başlatılamadı.");
                    setLoading(null);
                }
            } else {
                const err = await res.json();
                toast.error(err.error || "Hata oluştu");
                setLoading(null);
            }
        } catch (error) {
            console.error(error);
            toast.error("Bir hata oluştu");
            setLoading(null);
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-3">
            {packages.map((pkg) => (
                <div key={pkg.id} className="relative flex flex-col justify-between rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
                    {pkg.id === 'pkg_pro' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                            En Popüler
                        </div>
                    )}

                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                        <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-extrabold text-gray-900">{pkg.credits}</span>
                            <span className="ml-1 text-sm font-medium text-gray-500">Kredi</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            {pkg.priceTRY} ₺ ({Math.round(pkg.priceTRY / pkg.credits)} ₺/kredi)
                        </p>
                    </div>

                    <ul className="mb-6 space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>{pkg.credits} Teklif Hakkı (Rehber)</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>veya {Math.floor(pkg.credits / 2)} Teklif (Organizasyon)</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Öne Çıkarma İmkanı</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Süresiz Kullanım</span>
                        </li>
                    </ul>

                    <Button
                        onClick={() => handleBuy(pkg)}
                        disabled={loading !== null}
                        className={`w-full ${pkg.id === 'pkg_pro' ? 'bg-primary hover:bg-primary/90' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                    >
                        {loading === pkg.id ? (
                            "İşleniyor..."
                        ) : (
                            <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Satın Al
                            </>
                        )}
                    </Button>
                </div>
            ))}
        </div>
    );
}
