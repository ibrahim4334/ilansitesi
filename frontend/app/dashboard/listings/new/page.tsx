"use client";

import { useState, useEffect } from "react";
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
import { Plus, Trash2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

const SAUDI_CITIES = ["Mekke", "Medine", "Cidde", "Riyad"];

const URGENCY_TAGS = [
    { value: "NONE", label: "Yok" },
    { value: "SON_FIRSAT", label: "Son Fırsat" },
    { value: "SINIRLI_KONTENJAN", label: "Sınırlı Kontenjan" },
    { value: "ERKEN_REZERVASYON", label: "Erken Rezervasyon" },
];

const EXTRA_SERVICES_OPTIONS = [
    "Kahvaltı", "Öğle Yemeği", "Akşam Yemeği", "Vize", "Ulaşım", "Rehberlik", "Ziyaretler", "Kite Seti", "Sim Kart"
];

export default function NewListingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Dynamic Data State
    const [cities, setCities] = useState<any[]>([]);
    const [airlines, setAirlines] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        city: "", // Saudi city
        departureCityId: "", // Changed from departureCity string
        meetingCity: "",
        hotelName: "",
        airlineId: "", // Changed from airline string
        quota: "30",
        startDate: "",
        departureDateEnd: "",
        endDate: "",
        returnDateEnd: "",
        totalDays: 10,
        pricing: {
            double: "",
            triple: "",
            quad: "",
            currency: "SAR"
        },
        extraServices: [] as string[],
        tourPlan: [] as { day: number; city: string; description: string }[],
        urgencyTag: "",
        legalConsent: false,
        image: "" // Added image field to formData
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [citiesRes, airlinesRes] = await Promise.all([
                    fetch('/api/cities'),
                    fetch('/api/airlines')
                ]);

                if (citiesRes.ok) setCities(await citiesRes.json());
                if (airlinesRes.ok) setAirlines(await airlinesRes.json());
            } catch (err) {
                console.error("Failed to fetch form data", err);
                toast.error("Form verileri yüklenirken hata oluştu.");
            }
        };
        fetchData();
    }, []);

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
        // Fix for SelectItem not allowing empty strings
        if (name === "urgencyTag" && value === "NONE") {
            setFormData({ ...formData, [name]: "" });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleServiceToggle = (service: string) => {
        setFormData(prev => {
            const exists = prev.extraServices.includes(service);
            if (exists) {
                return { ...prev, extraServices: prev.extraServices.filter(s => s !== service) };
            } else {
                return { ...prev, extraServices: [...prev.extraServices, service] };
            }
        });
    };

    // Tour Plan Logic
    const addTourDay = () => {
        setFormData(prev => ({
            ...prev,
            tourPlan: [
                ...prev.tourPlan,
                { day: prev.tourPlan.length + 1, city: "Mekke", description: "" }
            ]
        }));
    };

    const updateTourDay = (index: number, field: string, value: string) => {
        const newPlan = [...formData.tourPlan];
        newPlan[index] = { ...newPlan[index], [field]: value };
        setFormData({ ...formData, tourPlan: newPlan });
    };

    const removeTourDay = (index: number) => {
        const newPlan = formData.tourPlan.filter((_, i) => i !== index).map((day, i) => ({ ...day, day: i + 1 }));
        setFormData({ ...formData, tourPlan: newPlan });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.legalConsent) {
            toast.error("Lütfen yasal sorumluluk beyanını onaylayın.");
            setLoading(false);
            return;
        }

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

            toast.success(data.message || "Tur başarıyla oluşturuldu!");
            router.refresh();
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
                            <Select onValueChange={(v) => handleSelectChange("departureCityId", v)}>
                                <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                <SelectContent>
                                    {cities.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name} {c.priority ? '⭐' : ''}
                                        </SelectItem>
                                    ))}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Hava Yolu</Label>
                            <Select onValueChange={(v) => handleSelectChange("airlineId", v)}>
                                <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                <SelectContent>
                                    {airlines.map((a: any) => (
                                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Aciliyet / Etiket</Label>
                            <Select onValueChange={(v) => handleSelectChange("urgencyTag", v)}>
                                <SelectTrigger><SelectValue placeholder="Yok" /></SelectTrigger>
                                <SelectContent>
                                    {URGENCY_TAGS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <h3 className="font-medium">Tarih Planlaması</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label className="mb-1.5 block">Gidiş Tarih Aralığı (Tahmini)</Label>
                                <DatePickerWithRange
                                    className="w-full"
                                    date={{
                                        from: formData.startDate ? new Date(formData.startDate) : undefined,
                                        to: formData.departureDateEnd ? new Date(formData.departureDateEnd) : undefined
                                    }}
                                    setDate={(range) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            startDate: range?.from ? range.from.toISOString() : "",
                                            departureDateEnd: range?.to ? range.to.toISOString() : ""
                                        }))
                                    }}
                                />
                                <p className="text-xs text-gray-500 mt-1">Hangi tarihler arasında gidiş planlanıyor?</p>
                            </div>
                            <div>
                                <Label className="mb-1.5 block">Dönüş Tarih Aralığı (Tahmini)</Label>
                                <DatePickerWithRange
                                    className="w-full"
                                    date={{
                                        from: formData.endDate ? new Date(formData.endDate) : undefined,
                                        to: formData.returnDateEnd ? new Date(formData.returnDateEnd) : undefined
                                    }}
                                    setDate={(range) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            endDate: range?.from ? range.from.toISOString() : "",
                                            returnDateEnd: range?.to ? range.to.toISOString() : ""
                                        }))
                                    }}
                                />
                                <p className="text-xs text-gray-500 mt-1">Hangi tarihler arasında dönüş planlanıyor?</p>
                            </div>
                        </div>
                        <div>
                            <Label>Toplam Gün Sayısı</Label>
                            <Input
                                type="number"
                                name="totalDays"
                                value={formData.totalDays}
                                onChange={(e) => setFormData({ ...formData, totalDays: parseInt(e.target.value) })}
                                required
                                className="max-w-[150px]"
                            />
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

                {/* Extra Services */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold border-b pb-2">Hizmetler</h2>
                    <div className="flex flex-wrap gap-2">
                        {EXTRA_SERVICES_OPTIONS.map(service => (
                            <Badge
                                key={service}
                                variant={formData.extraServices.includes(service) ? "default" : "outline"}
                                className={`cursor-pointer hover:bg-gray-200 ${formData.extraServices.includes(service) ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                onClick={() => handleServiceToggle(service)}
                            >
                                {service}
                                {formData.extraServices.includes(service) && <Check className="w-3 h-3 ml-1" />}
                            </Badge>
                        ))}
                    </div>
                </div>



                {/* Details */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold border-b pb-2">Diğer Detaylar</h2>
                    <div>
                        <Label>Kontenjan</Label>
                        <Input type="number" name="quota" value={formData.quota} onChange={handleChange} required />
                    </div>
                    <div>
                        <Label>Otel Adı</Label>
                        <Input name="hotelName" placeholder="Örn: Hilton Makkah" value={formData.hotelName} onChange={handleChange} />
                    </div>
                    <div>
                        <Label>Genel Açıklama</Label>
                        <Textarea name="description" placeholder="Tur genel detayları..." className="h-32" value={formData.description} onChange={handleChange} />
                    </div>
                </div>

                <div className="flex items-start space-x-2 p-4 bg-purple-50 rounded-lg border border-purple-100 mb-4">
                    <Checkbox
                        id="irregularProgram"
                        checked={formData.extraServices.includes("IRREGULAR_PROGRAM")}
                        onCheckedChange={() => handleServiceToggle("IRREGULAR_PROGRAM")}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="irregularProgram"
                            className="text-sm font-medium leading-none text-purple-900"
                        >
                            Tur planını ilanda görülebilir yapın!
                        </label>
                        <p className="text-sm text-purple-700">
                            İşaretlenirse, detaylı gün-gün program oluşturucu açılacaktır. Normal turlar için sadece genel açıklama yeterlidir.
                        </p>
                    </div>
                </div>

                <div className="flex items-start space-x-2 p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <Checkbox
                        id="pdfProgram"
                        checked={formData.extraServices.includes("PDF_PROGRAM")}
                        onCheckedChange={() => handleServiceToggle("PDF_PROGRAM")}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="pdfProgram"
                            className="text-sm font-medium leading-none text-amber-900"
                        >
                            Tur Programı PDF'e Dönüştürülsün mü?
                        </label>
                        <p className="text-sm text-amber-700">
                            İşaretlenirse, program PDF olarak indirilebilir olur.
                        </p>
                    </div>
                </div>

                {/* Tour Plan Builder - Only for Irregular Programs */}
                {formData.extraServices.includes("IRREGULAR_PROGRAM") && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-center border-b pb-2">
                            <div>
                                <h2 className="text-xl font-semibold">Tur Programı</h2>
                                <p className="text-sm text-gray-500">Gün gün program detaylarını giriniz.</p>
                            </div>
                            <Button type="button" size="sm" onClick={addTourDay} variant="secondary">
                                <Plus className="w-4 h-4 mr-1" /> Gün Ekle
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {formData.tourPlan.length === 0 && (
                                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                    Henüz tur programı eklenmedi.
                                </div>
                            )}
                            {formData.tourPlan.map((day, index) => (
                                <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border">
                                    <div className="min-w-[80px] font-bold text-amber-600 pt-2">
                                        {day.day}. Gün
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Select value={day.city} onValueChange={(v) => updateTourDay(index, 'city', v)}>
                                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Mekke">Mekke</SelectItem>
                                                <SelectItem value="Medine">Medine</SelectItem>
                                                <SelectItem value="Cidde">Cidde</SelectItem>
                                                <SelectItem value="Diğer">Diğer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Textarea
                                            placeholder="Günün programı... (örn: Kabe ziyareti)"
                                            value={day.description}
                                            onChange={(e) => updateTourDay(index, 'description', e.target.value)}
                                            className="bg-white min-h-[80px]"
                                            maxLength={500}
                                        />
                                        <div className="text-xs text-right text-gray-400">{day.description.length}/500</div>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTourDay(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Legal Consent */}
                <div className="flex items-start space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <Checkbox
                        id="legalConsent"
                        checked={formData.legalConsent}
                        onCheckedChange={(c) => setFormData({ ...formData, legalConsent: c === true })}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="legalConsent"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-blue-900"
                        >
                            Yasal Sorumluluk Beyanı
                        </label>
                        <p className="text-sm text-blue-700">
                            Paylaştığım iletişim bilgilerinin ve tur detaylarının doğruluğundan tamamen sorumlu olduğumu, iletişim bilgilerimin ilanda görüntülenebileceğini kabul ediyorum.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => router.back()}>İptal</Button>
                    <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? "Oluşturuluyor..." : "İlanı Onaya Gönder"}
                    </Button>
                </div>

            </form>
        </div>
    );
}
