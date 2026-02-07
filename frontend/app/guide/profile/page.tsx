"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function GuideProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        city: "",
        bio: "",
        isDiyanet: false
    });

    useEffect(() => {
        fetch("/api/guide/profile")
            .then(res => res.json())
            .then(data => {
                if (data.userId) {
                    setFormData({
                        fullName: data.fullName || "",
                        phone: data.phone || "",
                        city: data.city || "",
                        bio: data.bio || "",
                        isDiyanet: data.isDiyanet || false
                    });
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/guide/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                toast.success("Profil güncellendi.");
                router.push("/dashboard"); // Redirect back to dashboard to start creating listings
            } else {
                toast.error("Hata oluştu.");
            }
        } catch (e) {
            toast.error("Sunucu hatası.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

    return (
        <div className="max-w-xl mx-auto py-10 px-4">
            <h1 className="text-2xl font-bold mb-6">Rehber Profili</h1>
            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Ad Soyad</Label>
                        <Input
                            value={formData.fullName}
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label>Telefon (WhatsApp için)</Label>
                        <Input
                            value={formData.phone}
                            placeholder="+90 555..."
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">İlanlarınızda bu numara gösterilecektir.</p>
                    </div>
                    <div>
                        <Label>Şehir</Label>
                        <Input
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label>Hakkında (Biyografi)</Label>
                        <Textarea
                            rows={4}
                            value={formData.bio}
                            placeholder="Kendinizi tanıtın..."
                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded">
                        <Switch
                            checked={formData.isDiyanet}
                            onCheckedChange={c => setFormData({ ...formData, isDiyanet: c })}
                        />
                        <Label>Diyanet Personeli misiniz?</Label>
                    </div>

                    <Button type="submit" className="w-full" disabled={saving}>
                        {saving ? "Kaydediliyor..." : "Kaydet ve Devam Et"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
