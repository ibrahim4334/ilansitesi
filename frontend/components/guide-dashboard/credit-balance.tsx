"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function CreditBalance() {
    const [credits, setCredits] = useState<number | null>(null);

    const fetchCredits = async () => {
        try {
            const res = await fetch("/api/guide/topup");
            if (res.ok) {
                const data = await res.json();
                setCredits(data.credits);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchCredits();
    }, []);

    if (credits === null) return null;

    return (
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                    <Wallet className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-gray-500">Mevcut Bakiye</h3>
                    <p className="text-2xl font-bold text-gray-900">{credits} Kredi</p>
                </div>
            </div>
            <Button asChild variant="default" className="bg-amber-600 hover:bg-amber-700 text-white">
                <a href="/dashboard/billing">
                    Kredi Yükle
                </a>
            </Button>
        </div>
    );
}
