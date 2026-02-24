"use client";

import { useEffect, useState } from "react";
import { UmrahRequest } from "@/lib/db-types";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, FileText, X } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { toast } from "sonner";

const MAX_ACTIVE_REQUESTS = 3;

export default function UserRequestsPage() {
    const [requests, setRequests] = useState<UmrahRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await fetch("/api/requests");
                if (res.ok) {
                    const data = await res.json();
                    setRequests(data);
                }
            } catch (error) {
                console.error("Error fetching requests:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

    // Filter out deleted requests for display; count active for limit
    const visibleRequests = requests.filter(r => r.status !== 'deleted');
    const activeCount = requests.filter(r => r.status === 'open').length;
    const limitReached = activeCount >= MAX_ACTIVE_REQUESTS;


    const handleDelete = async (requestId: string) => {
        if (!confirm("Talebi silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/requests/${requestId}`, { method: 'DELETE' });
            if (res.ok) {
                setRequests(prev => prev.filter(r => r.id !== requestId));
                toast.success("Talep silindi");
            } else {
                const data = await res.json();
                toast.error(data.error || "Bir hata oluştu");
            }
        } catch (e) {
            toast.error("Hata oluştu");
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="container mx-auto py-10 px-4 space-y-4">
                    <div className="flex justify-between items-center mb-6">
                        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Taleplerim</h1>
                <div className="flex items-center gap-3">
                    {limitReached && (
                        <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
                            Maksimum {MAX_ACTIVE_REQUESTS} aktif talep
                        </span>
                    )}
                    <Link href={limitReached ? "#" : "/dashboard/requests/new"}>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={limitReached}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Yeni Talep Oluştur
                        </Button>
                    </Link>
                </div>
            </div>

            {visibleRequests.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg text-gray-700">Henüz bir talep oluşturmadınız</h3>
                    <p className="text-gray-500 mt-1 mb-6">Hayalinizdeki umre için ilk adımı atın.</p>
                    <Link href="/dashboard/requests/new">
                        <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                            Hemen Oluştur
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {visibleRequests.map((req) => (
                        <div key={req.id} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-lg text-gray-900">{req.departureCity} Çıkışlı</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${req.status === 'open' ? 'bg-green-100 text-green-700' :
                                            req.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                                                'bg-red-100 text-red-600'
                                            }`}>
                                            {req.status === 'open' ? 'Aktif' : req.status === 'closed' ? 'Kapalı' : 'Silindi'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true, locale: tr })}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                                <div>
                                    <span className="text-gray-500 block">Kişi Sayısı</span>
                                    <span className="font-medium">{req.peopleCount} Kişi</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Tarih</span>
                                    <span className="font-medium">{req.dateRange}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Oda Tipi</span>
                                    <span className="font-medium capitalize">{req.roomType?.replace('-', ' ') || 'Belirtilmedi'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Bütçe</span>
                                    <span className="font-medium">
                                        {req.budget ? `${req.budget.toLocaleString('tr-TR')} ₺` : 'Esnek'}
                                    </span>
                                </div>
                            </div>

                            {req.note && (
                                <div className="mt-4 bg-gray-50 p-3 rounded text-sm text-gray-700 italic border">
                                    &quot;{req.note}&quot;
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                                {req.status === 'open' && (
                                    <Link href={`/dashboard/requests/${req.id}/edit`}>
                                        <Button variant="outline" size="sm">Düzenle</Button>
                                    </Link>
                                )}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(req.id)}
                                >
                                    Sil
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}

