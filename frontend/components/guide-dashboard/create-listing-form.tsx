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
    const [quota, setQuota] = useState("30");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/listings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, city, quota })
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
            router.refresh(); // Refresh to show in list
        } catch (e) {
            // Already handled specific error above, but catch generic network issues
            // toast.error("Error creating listing"); 
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
                <div>
                    <label className="block text-sm font-medium mb-1">Şehir</label>
                    <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Örn: İstanbul"
                        required
                    />
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
                <Button type="submit" disabled={loading}>
                    {loading ? "Oluşturuluyor..." : "Oluştur"}
                </Button>
            </form>
        </div>
    );
}
