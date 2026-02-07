"use client";

import { useState } from "react";
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
import { useRouter } from "next/navigation";

const CITIES = [
    "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Konya", "Adana", "Gaziantep",
];

const ROOM_TYPES = [
    { id: "2-kisilik", label: "2 Kişilik Oda" },
    { id: "3-kisilik", label: "3 Kişilik Oda" },
    { id: "4-kisilik", label: "4 Kişilik Oda" },
];

export default function RequestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        departureCity: "",
        peopleCount: "",
        dateRange: "",
        roomType: "",
        budget: "",
        note: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Bir hata oluştu");
            }

            toast.success("Talebiniz yayınlandı. Rehberlerden teklif bekleniyor.");
            router.push("/");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-lg">
            <h1 className="text-2xl font-bold mb-6 text-center">Umre Talebi Oluştur</h1>
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border">
                <div>
                    <label className="block text-sm font-medium mb-1">Kalkış Şehri</label>
                    <Select onValueChange={(v) => handleSelectChange("departureCity", v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Şehir seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            {CITIES.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Kişi Sayısı</label>
                    <Input
                        name="peopleCount"
                        type="number"
                        placeholder="Örn: 2"
                        value={formData.peopleCount}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Tercih Edilen Tarih Aralığı</label>
                    <Input
                        name="dateRange"
                        placeholder="Örn: 15-30 Mart 2025"
                        value={formData.dateRange}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Oda Tipi</label>
                    <Select onValueChange={(v) => handleSelectChange("roomType", v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Oda tipi seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            {ROOM_TYPES.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Bütçe (Kişi Başı - SAR)</label>
                    <Input
                        name="budget"
                        type="number"
                        placeholder="Örn: 5000"
                        value={formData.budget}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Notlar (Opsiyonel)</label>
                    <Textarea
                        name="note"
                        placeholder="Özel isteklerinizi buraya yazabilirsiniz..."
                        value={formData.note}
                        onChange={handleChange}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Gönderiliyor..." : "Teklif Al"}
                </Button>
            </form>
        </div>
    );
}
