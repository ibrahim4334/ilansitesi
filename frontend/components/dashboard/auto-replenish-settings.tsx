"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export function AutoReplenishSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Config State
    const [status, setStatus] = useState("DISABLED");
    const [threshold, setThreshold] = useState(20);
    const [packageId, setPackageId] = useState("medium");
    const [monthlyCap, setMonthlyCap] = useState(500);

    useEffect(() => {
        fetch("/api/guide/auto-replenish")
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setStatus(data.status || "DISABLED");
                    setThreshold(data.threshold || 20);
                    setPackageId(data.packageId || "medium");
                    setMonthlyCap(data.monthlyCap || 500);
                }
            })
            .catch(() => toast.error("Bakiye ayarları yüklenemedi."))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/guide/auto-replenish", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status,
                    threshold,
                    packageId,
                    monthlyCap
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Otomatik yükleme ayarları kaydedildi.");
            } else {
                toast.error(data.error || "Ayarlar kaydedilemedi.");
            }
        } catch (error) {
            toast.error("Bir ağ hatası oluştu.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />;

    const isActive = status === "ACTIVE";

    return (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <RefreshCcw className="w-5 h-5 text-blue-600" />
                        Otomatik Kredi Yükleme
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Krediniz bittiğinde talepleri kaçırmamak için otomatik satın alma talimatı verin.
                    </p>
                </div>
                <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => setStatus(checked ? "ACTIVE" : "DISABLED")}
                    className="data-[state=checked]:bg-blue-600"
                />
            </div>

            {isActive && (
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Tetikleme Limiti (Kredi)</Label>
                            <Input
                                type="number"
                                min="1"
                                value={threshold}
                                onChange={(e) => setThreshold(Number(e.target.value))}
                                className="bg-gray-50"
                            />
                            <p className="text-xs text-gray-500">Bakiye bu değerin altına düştüğünde işlem tetiklenir.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Aylık Tavan (Max Jeton)</Label>
                            <Input
                                type="number"
                                min="10"
                                value={monthlyCap}
                                onChange={(e) => setMonthlyCap(Number(e.target.value))}
                                className="bg-gray-50"
                            />
                            <p className="text-xs text-gray-500">Bir takvim ayı içerisinde alım yapılabilecek tavan sınır.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Yüklenecek Özellik Paketi</Label>
                        <Select value={packageId} onValueChange={setPackageId}>
                            <SelectTrigger className="bg-gray-50">
                                <SelectValue placeholder="Paket Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="small">Small Paket (20 Kredi) - Uygun fiyat odaklı</SelectItem>
                                <SelectItem value="medium">Medium Paket (50 Kredi) - Standart</SelectItem>
                                <SelectItem value="large">Large Paket (100 Kredi) - Yüksek hacim</SelectItem>
                                <SelectItem value="mega">Mega Paket (250 Kredi) - Profesyonel</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg text-amber-800 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>
                            Sistem otomatik yüklemeleri kayıtlı varsayılan ödeme yönteminiz (Stripe) üzerinden tahsil edecektir. Her alım sonrası e-posta ile faturalandırılırsınız.
                        </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                        >
                            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
