
"use client";

import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { MessageSquare, Calendar, UserCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MyOffers() {
    const { data, isLoading } = useSWR('/api/guide/offers', fetcher);

    if (isLoading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl"></div>;

    const offers = data?.offers || [];

    if (offers.length === 0) {
        return (
            <div className="bg-white border rounded-xl p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Henüz teklifiniz yok</h3>
                    <p className="text-sm text-gray-500 mt-1">Açık taleplere göz atın ve ilk teklifinizi verin.</p>
                </div>
                <Link href="/dashboard/requests" className="inline-block text-sm font-medium text-blue-600 hover:underline">
                    Talepleri İncele &rarr;
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Teklif Verdiğim Talepler</h2>
            </div>

            <div className="grid gap-4">
                {offers.map((req: any) => (
                    <div key={req.id} className="bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-medium text-gray-900">{req.departureCity} - {req.peopleCount} Kişi</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <UserCheck className="w-3 h-3" />
                                    Teklif: {formatDistanceToNow(new Date(req.interestDate), { addSuffix: true, locale: tr })}
                                </p>
                            </div>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                                İletişime Geçildi
                            </Badge>
                        </div>

                        <div className="text-sm text-gray-600 mb-4 line-clamp-1">
                            {req.note || "Not belirtilmemiş"}
                        </div>

                        <Link
                            href={`/dashboard/requests/${req.id}`}
                            className="block w-full text-center py-2 px-4 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            Detayları Gör
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
