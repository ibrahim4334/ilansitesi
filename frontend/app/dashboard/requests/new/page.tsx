"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

const CITIES = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin",
    "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
    "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan",
    "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul",
    "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir",
    "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş",
    "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas",
    "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];
const ROOM_TYPES = [
    { value: "2-kisilik", label: "2 Kişilik Oda" },
    { value: "3-kisilik", label: "3 Kişilik Oda" },
    { value: "4-kisilik", label: "4 Kişilik Oda" },
];

export default function NewRequestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true); // Start loading to check limit
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
        // Check limit
        const checkLimit = async () => {
            try {
                const res = await fetch("/api/requests");
                if (res.ok) {
                    const data = await res.json();
                    // Filter for active/open requests if API returns all
                    const activeCount = data.filter((r: any) => r.status === 'open').length;
                    if (activeCount >= 3) {
                        toast.error("Talep hakkınız dolmuştur. Yeni talep için mevcut taleplerden birini silmelisiniz.");
                        router.push("/dashboard/requests");
                        return;
                    }
                }
                setLoading(false);
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };
        checkLimit();
    }, [router]);

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
            // Format date range string if using DatePicker
            dateRange: formData.startDate && formData.endDate
                ? `${formData.startDate.toLocaleDateString('tr-TR')} - ${formData.endDate.toLocaleDateString('tr-TR')}`
                : formData.dateRange
        };

        try {
            const res = await fetch("/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error === "Limit Reached") {
                    toast.error(data.message);
                    router.push("/dashboard/requests");
                    return;
                }
                throw new Error(data.message || data.error || "Bir hata oluştu");
            }

            toast.success("Talebiniz başarıyla oluşturuldu!");
            router.refresh(); // Refresh stored data
            router.push("/dashboard/requests");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Kontroller sağlanıyor...</div>;

    return (
        <DashboardLayout>
            <div className="container mx-auto py-10 px-4 max-w-2xl">
                <h1 className="text-3xl font-bold mb-8">Yeni Talep Oluştur</h1>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Kalkış Şehri</Label>
                            <Select onValueChange={(v) => handleSelectChange("departureCity", v)}>
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
                        <p className="text-xs text-gray-400">Tahmini gitmek istediğiniz tarih aralığını seçiniz.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Oda Tercihi</Label>
                            <Select onValueChange={(v) => handleSelectChange("roomType", v)} defaultValue="2-kisilik">
                                <SelectTrigger>
                                    <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROOM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Kişi Başı Bütçe (SAR) (Opsiyonel)</Label>
                            <Input
                                type="number"
                                name="budget"
                                placeholder="Örn: 5000 SAR"
                                value={formData.budget}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Özel Notlar</Label>
                        <Textarea
                            name="note"
                            placeholder="Eklemek istediğiniz detaylar (örn: yaşlı yolcu, tekerlekli sandalye ihtiyacı vb.)"
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
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Talebi Gönder"}
                        </Button>
                    </div>

                </form>
            </div>
        </DashboardLayout>
    );
}
