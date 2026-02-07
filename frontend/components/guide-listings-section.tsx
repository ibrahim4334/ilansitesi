"use client";

import { useEffect, useState } from "react";
import { GuideListing } from "@/lib/db";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function GuideListingsSection() {
    const { data: session } = useSession();
    const router = useRouter();
    const [listings, setListings] = useState<GuideListing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/listings")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setListings(data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleJoin = async (listingId: string) => {
        if (!session) {
            toast.error("Lütfen önce giriş yapın");
            router.push("/login");
            return;
        }
        if (session.user.role !== 'USER') {
            toast.error("Sadece Umreciler turlara katılabilir");
            return;
        }

        try {
            const res = await fetch("/api/listings/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ listingId })
            });

            if (res.ok) {
                toast.success("Tura başarıyla katıldınız!");
                // Refresh listings to update counts
                const updatedListings = listings.map(l => {
                    if (l.id === listingId) {
                        return { ...l, filled: l.filled + 1 };
                    }
                    return l;
                });
                setListings(updatedListings);
            } else {
                const err = await res.json();
                toast.error(err.error || "Hata oluştu");
            }
        } catch (e) {
            toast.error("Bir hata oluştu");
        }
    };

    if (loading) return <div className="py-20 text-center">Yükleniyor...</div>;

    if (listings.length === 0) return null; // Don't show if empty

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Rehber Turları
                    </h2>
                    <p className="mt-4 text-lg text-gray-500">
                        Deneyimli rehberler eşliğinde özel turlar.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {listings.map((listing: any) => (
                        <div key={listing.id} className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col">
                            {/* Header */}
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-gray-900 leading-tight">{listing.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600 uppercase tracking-wide">
                                        {listing.city}
                                    </span>
                                    {listing.guide?.isDiyanet && (
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700">
                                            Diyanet Personeli
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Guide Info */}
                            <div className="flex items-start gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{listing.guide?.fullName || "Rehber"}</p>
                                    <p className="text-xs text-gray-500 line-clamp-2">{listing.guide?.bio || "Biyografi yok."}</p>
                                </div>
                            </div>

                            <div className="mb-6 flex-grow">
                                <p className="text-gray-500 line-clamp-2 text-sm">
                                    {listing.description || "Tur hakkında detaylı bilgi için rehber ile iletişime geçin."}
                                </p>
                            </div>

                            {/* Actions & Progress */}
                            <div className="mt-auto space-y-3">
                                {/* Stats */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Doluluk</span>
                                        <span className="font-medium text-gray-900">{listing.filled} / {listing.quota}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div
                                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min((listing.filled / listing.quota) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {listing.guide?.phone && (
                                        <Button variant="outline" className="w-full" asChild>
                                            <a
                                                href={`https://wa.me/${listing.guide.phone.replace(/\s+/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                WhatsApp
                                            </a>
                                        </Button>
                                    )}
                                    <Button
                                        className={listing.guide?.phone ? "w-full" : "col-span-2"}
                                        onClick={() => handleJoin(listing.id)}
                                        variant={session?.user?.role === 'USER' ? 'default' : 'secondary'}
                                        disabled={listing.filled >= listing.quota}
                                    >
                                        {listing.filled >= listing.quota ? "Dolu" : "Katıl"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
