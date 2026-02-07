"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const CITIES = [
    "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Konya", "Adana", "Gaziantep",
];

const SAUDI_CITIES = ["Mekke", "Medine", "Cidde", "Riyad"];

const AIRLINES = ["THY", "Saudia", "Flynas", "Pegasus", "Emirates", "Qatar", "Diğer"];

export default function NewListingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        city: "", // Saudi city
        departureCity: "",
        meetingCity: "",
        hotelName: "",
        airline: "THY",
        quota: "30",
        startDate: "",
        endDate: "",
        pricing: {
            double: "",
            triple: "",
            quad: "",
            currency: "SAR"
        },
        extraServices: [] as string[]
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePriceChange = (type: 'double' | 'triple' | 'quad', value: string) => {
        setFormData({
            ...formData,
            pricing: { ...formData.pricing, [type]: value }
        });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            pricing: {
                double: parseFloat(formData.pricing.double) || 0,
                triple: parseFloat(formData.pricing.triple) || 0,
                quad: parseFloat(formData.pricing.quad) || 0,
                currency: "SAR"
            },
            // Legacy price for sorting (use quad as base)
            price: formData.pricing.quad || formData.pricing.triple || formData.pricing.double
        };

        try {
            const res = await fetch("/api/listings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.code === "LIMIT_REACHED") {
                    toast.error(data.message, {
                        action: {
                            label: "Paket Yükselt",
                            onClick: () => router.push("/dashboard/billing")
                        }
                    });
                } else {
                    throw new Error(data.error || "Bir hata oluştu");
                }
                return;
            }

            toast.success("Tur başarıyla oluşturuldu!");
            router.push("/dashboard/listings");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">Yeni Tur Oluştur</h1>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl border shadow-sm">

                {/* Basic Info */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold border-b pb-2">Temel Bilgiler</h2>

                    <div>
                        <Label>Tur Başlığı</Label>
                        <Input name="title" placeholder="Örn: 15 Günlük Ramazan Umresi" value={formData.title} onChange={handleChange} required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Kalkış Şehri</Label>
                            <Select onValueChange={(v) => handleSelectChange("departureCity", v)}>
                                <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                <SelectContent>
                                    {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Varış / Merkez Şehir</Label>
                            <Select onValueChange={(v) => handleSelectChange("city", v)}>
                                <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                <SelectContent>
                                    {SAUDI_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label>Hava Yolu</Label>
                        <Select onValueChange={(v) => handleSelectChange("airline", v)} defaultValue="THY">
                            <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                            <SelectContent>
                                {AIRLINES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Başlangıç Tarihi</Label>
                            <Input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
                        </div>
                        <div>
                            <Label>Bitiş Tarihi</Label>
                            <Input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold border-b pb-2">Fiyatlandırma (SAR)</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>4 Kişilik Oda</Label>
                            <Input type="number" placeholder="4500" value={formData.pricing.quad} onChange={e => handlePriceChange('quad', e.target.value)} required />
                        </div>
                        <div>
                            <Label>3 Kişilik Oda</Label>
                            <Input type="number" placeholder="5000" value={formData.pricing.triple} onChange={e => handlePriceChange('triple', e.target.value)} required />
                        </div>
                        <div>
                            <Label>2 Kişilik Oda</Label>
                            <Input type="number" placeholder="6000" value={formData.pricing.double} onChange={e => handlePriceChange('double', e.target.value)} required />
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold border-b pb-2">Detaylar</h2>
                    <div>
                        <Label>Kontenjan</Label>
                        <Input type="number" name="quota" value={formData.quota} onChange={handleChange} required />
                    </div>
                    <div>
                        <Label>Otel Adı</Label>
                        <Input name="hotelName" placeholder="Örn: Hilton Makkah" value={formData.hotelName} onChange={handleChange} />
                    </div>
                    <div>
                        <Label>Açıklama</Label>
                        <Textarea name="description" placeholder="Tur detayları..." className="h-32" value={formData.description} onChange={handleChange} />
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>İptal</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Oluşturuluyor..." : "İlanı Yayınla"}
                    </Button>
                </div>

            </form>
        </div>
    );
}
