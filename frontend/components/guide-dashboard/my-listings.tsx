"use client";

import { useEffect, useState } from "react";
import { GuideListing } from "@/lib/db-types";

export function MyListings() {
    const [listings, setListings] = useState<GuideListing[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchListings = async () => {
        try {
            const res = await fetch("/api/guide/my-listings");
            if (res.ok) {
                const data = await res.json();
                setListings(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    // Also listen for refresh? For now just fetch on mount.
    // Ideally we'd use SWR or React Query, but MVP.

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg">Turlarım</h3>
            {listings.length === 0 ? (
                <p className="text-gray-500">Henüz tur oluşturmadınız.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {listings.map((l) => (
                        <div key={l.id} className="border p-4 rounded bg-white shadow-sm">
                            <h4 className="font-bold">{l.title}</h4>
                            <p className="text-sm text-gray-600">{l.city}</p>
                            <div className="mt-2 text-sm">
                                <span className="font-semibold">Doluluk:</span> {l.filled} / {l.quota}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${Math.min((l.filled / l.quota) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
