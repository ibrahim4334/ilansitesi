"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CreateListingForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [city, setCity] = useState("");
    const [departureCity, setDepartureCity] = useState("");
    const [meetingCity, setMeetingCity] = useState("");
    const [hotelName, setHotelName] = useState("");
    const [airline, setAirline] = useState("");
    const [price, setPrice] = useState("");
    const [quota, setQuota] = useState("30");
    const [extraServices, setExtraServices] = useState<string[]>([]);

    const servicesList = ["Otel Dahil", "Transfer", "Rehberlik", "7/24 Destek", "Bayan Rehber"];

    const toggleService = (service: string) => {
        setExtraServices(prev =>
            prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/listings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    city,
                    departureCity,
                    meetingCity,
                    hotelName,
                    airline,
                    price,
                    quota,
                    extraServices
                })
            });

            if (!res.ok) {
                const data = await res.json();
                if (data.error === "ProfileIncomplete") {
                    toast.error("İlan oluşturmak için profilinizi tamamlamalısınız.");
                    router.push("/guide/profile");
                    return;
                }
                throw new Error("Failed to create");
            }

            toast.success("Listing created!");
            setTitle("");
            setCity("");
            setDepartureCity("");
            setMeetingCity("");
            setHotelName("");
            setAirline("");
            setPrice("");
            setExtraServices([]);
            router.refresh();
        } catch (e) {
            toast.error("Error creating listing");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded shadow-sm bg-white">
            <h3 className="font-bold mb-4">Yeni Tur Oluştur</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Tur Başlığı</label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Örn: Ramazan Umresi"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Rehber Şehri (Konum)</label>
                        <Input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Örn: Mekke / Medine"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Kalkış Şehri</label>
                        <Input
                            value={departureCity}
                            onChange={(e) => setDepartureCity(e.target.value)}
                            placeholder="Örn: İstanbul"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Buluşma Noktası (Opsiyonel)</label>
                        <Input
                            value={meetingCity}
                            onChange={(e) => setMeetingCity(e.target.value)}
                            placeholder="Örn: Cidde Havalimanı"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Fiyat (₺)</label>
                        <Input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Otel Adı (Opsiyonel)</label>
                        <Input
                            value={hotelName}
                            onChange={(e) => setHotelName(e.target.value)}
                            placeholder="Örn: Swissotel"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Havayolu (Opsiyonel)</label>
                        <Input
                            value={airline}
                            onChange={(e) => setAirline(e.target.value)}
                            placeholder="Örn: THY"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Ekstra Hizmetler</label>
                    <div className="flex flex-wrap gap-2">
                        {servicesList.map((service) => (
                            <button
                                key={service}
                                type="button"
                                onClick={() => toggleService(service)}
                                className={`px-3 py-1 rounded-full text-xs border transition-colors ${extraServices.includes(service)
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                    }`}
                            >
                                {service}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Kota</label>
                    <Input
                        type="number"
                        value={quota}
                        onChange={(e) => setQuota(e.target.value)}
                        placeholder="30"
                        required
                    />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Oluşturuluyor..." : "İlanı Yayınla"}
                </Button>
            </form>
        </div>
    );
}
