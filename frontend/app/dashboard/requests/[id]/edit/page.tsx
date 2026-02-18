"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

const CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Konya", "Diğer"];
const ROOM_TYPES = [
    { value: "2-kisilik", label: "2 Kişilik Oda" },
    { value: "3-kisilik", label: "3 Kişilik Oda" },
    { value: "4-kisilik", label: "4 Kişilik Oda" },
];

export default function EditRequestPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        departureCity: "",
        peopleCount: "2",
        dateRange: "",
        startDate: undefined as Date | undefined,
        endDate: undefined as Date | undefined,
        budget: "",
        roomType: "2-kisilik",
        note: "",
        contactViaEmail: false,
        contactViaPhone: false,
        contactViaChat: true
    });

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const res = await fetch(`/api/requests/${id}`);
                if (res.ok) {
                    const data = await res.json();

                    // Parse dates from dateRange string "DD.MM.YYYY - DD.MM.YYYY"
                    let start: Date | undefined;
                    let end: Date | undefined;

                    if (data.dateRange && data.dateRange.includes(" - ")) {
                        const parts = data.dateRange.split(" - ");
                        if (parts.length === 2) {
                            const [d1, m1, y1] = parts[0].split(".").map(Number);
                            const [d2, m2, y2] = parts[1].split(".").map(Number);
                            start = new Date(y1, m1 - 1, d1);
                            end = new Date(y2, m2 - 1, d2);
                        }
                    }

                    setFormData({
                        departureCity: data.departureCity,
                        peopleCount: data.peopleCount.toString(),
                        dateRange: data.dateRange,
                        startDate: start,
                        endDate: end,
                        budget: data.budget ? data.budget.toString() : "",
                        roomType: data.roomType,
                        note: data.note || "",
                        contactViaEmail: data.contactPreferences?.email ?? false,
                        contactViaPhone: data.contactPreferences?.phone ?? false,
                        contactViaChat: data.contactPreferences?.chat ?? true
                    });
                } else {
                    toast.error("Talep bulunamadı");
                    router.push("/dashboard/requests");
                }
            } catch (e) {
                console.error(e);
                toast.error("Bir hata oluştu");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchRequest();
    }, [id, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setFormData({ ...formData, [name]: checked });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            ...formData,
            peopleCount: parseInt(formData.peopleCount),
            budget: formData.budget ? parseFloat(formData.budget) : null,
            dateRange: formData.startDate && formData.endDate
                ? `${formData.startDate.toLocaleDateString('tr-TR')} - ${formData.endDate.toLocaleDateString('tr-TR')}`
                : formData.dateRange
        };

        try {
            const res = await fetch(`/api/requests/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || data.error || "Bir hata oluştu");
            }

            toast.success("Talep güncellendi!");
            router.refresh();
            router.push("/dashboard/requests");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <DashboardLayout><div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="container mx-auto py-10 px-4 max-w-2xl">
                <h1 className="text-3xl font-bold mb-8">Talebi Düzenle</h1>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Kalkış Şehri</Label>
                            <Select onValueChange={(v) => handleSelectChange("departureCity", v)} value={formData.departureCity}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Şehir Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Kişi Sayısı</Label>
                            <Input
                                type="number"
                                name="peopleCount"
                                min="1"
                                value={formData.peopleCount}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tarih Aralığı</Label>
                        <DatePickerWithRange
                            className="w-full"
                            date={{
                                from: formData.startDate,
                                to: formData.endDate
                            }}
                            setDate={(range) => {
                                setFormData(prev => ({
                                    ...prev,
                                    startDate: range?.from,
                                    endDate: range?.to
                                }))
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Oda Tercihi</Label>
                            <Select onValueChange={(v) => handleSelectChange("roomType", v)} value={formData.roomType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROOM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Kişi Başı Bütçe (Opsiyonel)</Label>
                            <Input
                                type="number"
                                name="budget"
                                placeholder="Örn: 50000"
                                value={formData.budget}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Özel Notlar</Label>
                        <Textarea
                            name="note"
                            placeholder="Eklemek istediğiniz detaylar"
                            value={formData.note}
                            onChange={handleChange}
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <Label className="text-base">İletişim Tercihleri</Label>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="contactViaChat"
                                    checked={formData.contactViaChat}
                                    onCheckedChange={(c: boolean) => handleCheckboxChange('contactViaChat', c)}
                                />
                                <Label htmlFor="contactViaChat">UmreBuldum içi mesajlaşma (Önerilen)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="contactViaEmail"
                                    checked={formData.contactViaEmail}
                                    onCheckedChange={(c: boolean) => handleCheckboxChange('contactViaEmail', c)}
                                />
                                <Label htmlFor="contactViaEmail">Mail ile iletişim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="contactViaPhone"
                                    checked={formData.contactViaPhone}
                                    onCheckedChange={(c: boolean) => handleCheckboxChange('contactViaPhone', c)}
                                />
                                <Label htmlFor="contactViaPhone">Telefon numaram görünsün</Label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Güncelle"}
                        </Button>
                    </div>

                </form>
            </div>
        </DashboardLayout>
    );
}
