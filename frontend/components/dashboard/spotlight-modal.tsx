"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SpotlightModalProps {
    isOpen: boolean;
    onClose: () => void;
    listingId: string;
    balance: number;
    cost?: number; // Should be fetched or defined statically
}

export function SpotlightPurchaseModal({ isOpen, onClose, listingId, balance, cost = 50 }: SpotlightModalProps) {
    const [loading, setLoading] = useState(false);
    const [city, setCity] = useState("ALL");
    const router = useRouter();

    const handlePurchase = async () => {
        if (balance < cost) {
            toast.error("Yetersiz kredi bakiyesi. Lütfen hesabınıza yükleme yapın.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/guide/spotlight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ listingId, city })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success(`Tebrikler! İlanınız bu saat için ${city} aramalarında öne çıkarıldı.`);
                router.refresh(); // Reflect token deduction in UI if balance lives in context or refresh layout
                onClose();
            } else {
                toast.error(data.error || "İşlem sırasında bir hata oluştu.");
            }
        } catch (error) {
            toast.error("Ağ bağlantısı koptu. Tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        Spotlight Öne Çıkarma
                    </DialogTitle>
                    <DialogDescription>
                        İlanınızı hedef şehir ({city}) aramalarında 1 saat boyunca sponsorlu alanda sabitleyin. Her arama sayfasında ilk 3 sıradan garantili görünürlük elde edersiniz.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-slate-50 border rounded-xl p-4 my-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Hedef Şehir Seçimi</label>
                        <Select value={city} onValueChange={setCity}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Şehir seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tüm Türkiye (Genel Sayfa)</SelectItem>
                                <SelectItem value="İstanbul">İstanbul</SelectItem>
                                <SelectItem value="Ankara">Ankara</SelectItem>
                                <SelectItem value="İzmir">İzmir</SelectItem>
                                <SelectItem value="Bursa">Bursa</SelectItem>
                                <SelectItem value="Konya">Konya</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-3 border-t">
                        <span className="text-gray-500 font-medium">İşlem Bedeli:</span>
                        <span className="font-bold text-red-600">{cost} Kredi</span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-3 border-t">
                        <span className="text-gray-500 font-medium">Mevcut Bakiyeniz:</span>
                        <span className={`font-bold ${balance >= cost ? "text-emerald-600" : "text-red-600"}`}>
                            {balance} Kredi
                        </span>
                    </div>
                </div>

                <div className="bg-blue-50 text-blue-700 p-3 rounded-lg flex gap-2 text-xs">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>Güven skoru yeterli olan acenteler bu alana başvurabilir. Saatlik kota (3) dolmuşsa işlem reddedilir ve krediniz kesilmez.</p>
                </div>

                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Vazgeç
                    </Button>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handlePurchase} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {loading ? "Onaylanıyor..." : "Satın Al ve Öne Çıkar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
