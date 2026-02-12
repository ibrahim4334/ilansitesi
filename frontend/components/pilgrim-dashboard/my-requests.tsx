
"use client";

import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { MessageSquare, Calendar, Users } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MyRequests() {
    // We need a specific endpoint for MY requests, not all requests.
    // The current GET /api/requests returns ALL open requests for guides.
    // We should probably filter by user in the frontend or add a query param? 
    // Or better, creating a specific endpoint /api/user/requests or handling it in /api/requests with a role check.
    // Let's assume we created /api/user/requests or similar. 
    // Actually, let's create a new API route for this to be clean: /api/user/requests
    const { data, isLoading } = useSWR('/api/user/requests', fetcher);

    if (isLoading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl"></div>;

    const requests = data?.requests || [];

    if (requests.length === 0) {
        return (
            <div className="bg-white border rounded-xl p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Henüz talebiniz yok</h3>
                    <p className="text-sm text-gray-500 mt-1">Hayalinizdeki umre turu için ilk adımı atın.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Taleplerim ({requests.length}/3)</h2>
            </div>

            <div className="grid gap-4">
                {requests.map((req: any) => (
                    <div key={req.id} className="bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-medium text-gray-900">{req.departureCity} Çıkışlı</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true, locale: tr })}
                                </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${req.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                {req.status === 'open' ? 'Aktif' : 'Pasif'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                {req.peopleCount} Kişi
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {req.dateRange}
                            </div>
                        </div>

                        {/* This will link to the request detail page where they can see specific guide offers/notes if we implement that. 
                            For now, it goes to a detail page.
                        */}
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
