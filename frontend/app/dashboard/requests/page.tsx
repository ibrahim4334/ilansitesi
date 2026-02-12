"use client";

import { useEffect, useState } from "react";
import { UmrahRequest } from "@/lib/db-types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { CreditBalance, CREDIT_BALANCE_KEY } from "@/components/guide-dashboard/credit-balance";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSWRConfig as useConfiguredSWR } from "swr";
import useSWR from "swr";
import { Heart, Coins, AlertTriangle, Loader2, Inbox, Search } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function GuideRequestsPage() {
    const [requests, setRequests] = useState<UmrahRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [confirmModal, setConfirmModal] = useState<{ requestId: string; city: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { data: session } = useSession();
    const role = session?.user?.role;
    const creditCost = role === 'ORGANIZATION' ? 10 : 5;

    // Get current balance
    const { data: balanceData } = useSWR(CREDIT_BALANCE_KEY, fetcher);
    const currentBalance = balanceData?.credits ?? 0;

    useEffect(() => {
        const loadData = async () => {
            try {
                const [reqRes, favRes] = await Promise.all([
                    fetch("/api/requests"),
                    fetch("/api/requests/favorite")
                ]);

                if (reqRes.ok) {
                    const data = await reqRes.json();
                    if (Array.isArray(data)) setRequests(data);
                }

                if (favRes.ok) {
                    const data = await favRes.json();
                    if (Array.isArray(data.favorites)) setFavorites(new Set(data.favorites));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const router = useRouter();
    const { mutate } = useConfiguredSWR();

    const toggleFavorite = async (requestId: string) => {
        const isFav = favorites.has(requestId);
        setFavorites(prev => {
            const next = new Set(prev);
            if (isFav) next.delete(requestId);
            else next.add(requestId);
            return next;
        });

        try {
            await fetch("/api/requests/favorite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId })
            });
        } catch (e) {
            toast.error("Favori işlemi başarısız.");
            setFavorites(prev => {
                const next = new Set(prev);
                if (isFav) next.add(requestId);
                else next.delete(requestId);
                return next;
            });
        }
    };

    const handleInterestClick = (requestId: string, city: string) => {
        setConfirmModal({ requestId, city });
    };

    const handleConfirmInterest = async () => {
        if (!confirmModal) return;
        setSubmitting(true);

        try {
            const res = await fetch("/api/requests/interest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId: confirmModal.requestId })
            });

            if (res.ok) {
                toast.success("İlginiz kaydedildi. Sohbet başlatılıyor...");
                mutate(CREDIT_BALANCE_KEY);
                router.push(`/dashboard/requests/${confirmModal.requestId}`);
                setInterestedIds(prev => new Set(prev).add(confirmModal.requestId));
            } else {
                const data = await res.json();
                if (data.message === "Already expressed interest") {
                    toast.info("Bu talebe zaten ilgi gösterdiniz.");
                    router.push(`/dashboard/requests/${confirmModal.requestId}`);
                } else if (data.error === "INSUFFICIENT_CREDITS") {
                    toast.error("Bakiyeniz yetersiz. Lütfen kredi yükleyin.");
                } else {
                    toast.error("Bir hata oluştu.");
                }
            }
        } catch (error) {
            toast.error("Bağlantı hatası.");
        } finally {
            setSubmitting(false);
            setConfirmModal(null);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-10 px-4 space-y-4">
                <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-4">Gelen Umre Talepleri</h1>

            <CreditBalance />

            {/* Cost Info Banner */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <Coins className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                    Her ilgi beyanı <strong>{creditCost} kredi</strong> düşer. Mevcut bakiyeniz: <strong>{currentBalance} kredi</strong>
                </p>
            </div>

            {requests.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border">
                    <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg text-gray-700">Henüz açık talep yok</h3>
                    <p className="text-gray-500 mt-1">Yeni talepler oluşturulduğunda burada görünecek.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow relative">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-blue-900">{req.departureCity} Çıkışlı</h3>
                                    <p className="text-sm text-gray-500">
                                        {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true, locale: tr })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(req.id); }}
                                        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        <Heart
                                            className={`w-5 h-5 ${favorites.has(req.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                                        />
                                    </button>
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                        Yeni
                                    </span>
                                </div>
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
                                        &quot;{req.note}&quot;
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={() => handleInterestClick(req.id, req.departureCity)}
                                disabled={interestedIds.has(req.id) || currentBalance < creditCost}
                                variant={interestedIds.has(req.id) ? "secondary" : "default"}
                                className="w-full"
                            >
                                {interestedIds.has(req.id)
                                    ? "İlgi Gönderildi ✅"
                                    : currentBalance < creditCost
                                        ? "Yetersiz Bakiye 💰"
                                        : `Teklif Ver (${creditCost} Kredi) ✨`
                                }
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Credit Cost Confirmation Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
                    <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="text-center mb-5">
                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Coins className="w-7 h-7 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">İlgi Beyanı Onayla</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                <strong>{confirmModal.city}</strong> çıkışlı talebe ilgi göstermek üzeresiniz.
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">İşlem Maliyeti</span>
                                <span className="font-bold text-amber-700">{creditCost} Kredi</span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-2">
                                <span className="text-gray-600">Mevcut Bakiye</span>
                                <span className="font-bold text-gray-900">{currentBalance} Kredi</span>
                            </div>
                            <hr className="my-2 border-amber-200" />
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">İşlem Sonrası</span>
                                <span className={`font-bold ${(currentBalance - creditCost) < 5 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {currentBalance - creditCost} Kredi
                                </span>
                            </div>
                        </div>

                        {currentBalance < creditCost && (
                            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <p className="text-xs text-red-700">Yetersiz bakiye. Lütfen kredi yükleyin.</p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleConfirmInterest}
                                disabled={submitting || currentBalance < creditCost}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-1.5"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                                Onayla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
