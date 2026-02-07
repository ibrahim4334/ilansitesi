"use client";

import { useEffect, useState } from "react";
import { UmrahRequest } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { CreditBalance } from "@/components/guide-dashboard/credit-balance";

export default function GuideRequestsPage() {
    const [requests, setRequests] = useState<UmrahRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetch("/api/requests")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setRequests(data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleInterest = async (requestId: string) => {
        try {
            const res = await fetch("/api/requests/interest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId })
            });

            if (res.ok) {
                toast.success("İlginiz kaydedildi. Kullanıcıya bilgi verilecek.");
                setInterestedIds(prev => new Set(prev).add(requestId));
            } else {
                const data = await res.json();
                if (data.message === "Already expressed interest") {
                    toast.info("Bu talebe zaten ilgi gösterdiniz.");
                    setInterestedIds(prev => new Set(prev).add(requestId));
                } else if (data.error === "INSUFFICIENT_CREDITS") {
                    toast.error("Bakiyeniz yetersiz. Lütfen kredi yükleyin.");
                } else {
                    toast.error("Bir hata oluştu.");
                }
            }
        } catch (error) {
            toast.error("Bağlantı hatası.");
        }
    };

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-4">Gelen Umre Talepleri</h1>

            <CreditBalance />

            {requests.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border">
                    <p className="text-gray-500">Henüz açık bir talep bulunmuyor.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-blue-900">{req.departureCity} Çıkışlı</h3>
                                    <p className="text-sm text-gray-500">
                                        {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true, locale: tr })}
                                    </p>
                                </div>
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                    Yeni
                                </span>
                            </div>

                            <div className="space-y-3 mb-6 flex-grow">
                                <div className="flex items-center justify-between text-sm py-2 border-b">
                                    <span className="text-gray-500">Kişi Sayısı</span>
                                    <span className="font-medium">{req.peopleCount} Kişi</span>
                                </div>
                                <div className="flex items-center justify-between text-sm py-2 border-b">
                                    <span className="text-gray-500">Tarih</span>
                                    <span className="font-medium">{req.dateRange}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm py-2 border-b">
                                    <span className="text-gray-500">Bütçe (Kişi Başı)</span>
                                    <span className="font-medium">
                                        {req.budget ? `${req.budget.toLocaleString('tr-TR')} ₺` : 'Belirtilmedi'}
                                    </span>
                                </div>
                                {req.note && (
                                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 italic border">
                                        "{req.note}"
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={() => handleInterest(req.id)}
                                disabled={interestedIds.has(req.id)}
                                variant={interestedIds.has(req.id) ? "secondary" : "default"}
                                className="w-full"
                            >
                                {interestedIds.has(req.id) ? "İlgi Gönderildi ✅" : "İlgileniyorum ✨"}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
