
"use client";

import { CreditBalance } from "@/components/guide-dashboard/credit-balance";
import { CreditPackages } from "@/components/dashboard/credit-packages";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Suspense } from "react";

function BillingContent() {
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get("success")) {
            toast.success("Ödeme başarılı! Kredileriniz hesabınıza tanımlandı.");
        }
        if (searchParams.get("canceled")) {
            toast.error("Ödeme iptal edildi.");
        }
    }, [searchParams]);

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Ödemeler ve Kredi</h1>
                <p className="text-muted-foreground mt-2">
                    Kredi bakiyenizi yönetin ve yeni paketler satın alın.
                </p>
            </div>

            <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Mevcut Bakiye</h2>
                <CreditBalance />
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Kredi Paketleri</h2>
                <CreditPackages />
            </div>
        </div>
    );
}

export default function BillingPage() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <BillingContent />
        </Suspense>
    );
}
