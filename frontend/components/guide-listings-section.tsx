"use client";

import { useEffect, useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { Skeleton } from "@/components/ui/skeleton";

export function GuideListingsSection() {
    const [listings, setListings] = useState<any[]>([]); // Using any for enriched listing type
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

    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        En İyi Umre Turları
                    </h2>
                    <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                        Manevi yolculuğunuz için Diyanet onaylı ve tecrübeli rehberlerden size özel paketler.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-[400px] rounded-xl overflow-hidden border bg-white">
                                <Skeleton className="h-48 w-full" />
                                <div className="p-4 space-y-4">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-10 w-full mt-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {listings.length > 0 ? (
                            listings.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-10 text-gray-500">
                                Şu anda aktif tur bulunmamaktadır.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
