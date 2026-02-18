'use client';

import { Eye, MousePointer, MessageSquare, TrendingUp, Loader2 } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCards } from '@/components/dashboard/StatCards';
import { RequestList } from '@/components/dashboard/RequestCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { CreditBalance } from '@/components/guide-dashboard/credit-balance';

// Mock data - in real app, fetch from API
const mockStats = [
    { title: 'Görüntülenme', value: '12,456', icon: <Eye className="w-5 h-5" />, change: 12, trend: 'up' as const },
    { title: 'Tıklama', value: '2,341', icon: <MousePointer className="w-5 h-5" />, change: 8, trend: 'up' as const },
    { title: 'Talep', value: '48', icon: <MessageSquare className="w-5 h-5" />, change: 23, trend: 'up' as const },
    { title: 'Dönüşüm', value: '%5.2', icon: <TrendingUp className="w-5 h-5" />, change: -2, trend: 'down' as const },
];

const mockRequests = [
    {
        id: '1',
        customerName: 'Ahmet Yılmaz',
        listingTitle: 'Lüks Umre Turu - 15 Gün',
        message: 'Merhaba, Nisan ayı için müsaitlik durumunu öğrenmek istiyorum. 4 kişilik aile için uygun mu?',
        timeAgo: '2 saat önce',
        status: 'new' as const,
        phone: '+905551234567',
    },
    {
        id: '2',
        customerName: 'Fatma Demir',
        listingTitle: 'Ramazan Umresi Özel',
        message: 'Ramazan ayında son 10 gün için fiyat bilgisi alabilir miyim?',
        timeAgo: '5 saat önce',
        status: 'new' as const,
        phone: '+905559876543',
    },
    {
        id: '3',
        customerName: 'Mehmet Kaya',
        listingTitle: 'Ekonomik Umre Paketi',
        message: 'Ödeme planı hakkında bilgi almak istiyorum.',
        timeAgo: '1 gün önce',
        status: 'pending' as const,
    },
];

// --- Sub-Dashboards ---

import useSWR from 'swr';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function OrganizerDashboard({ userName }: { userName: string }) {
    const { data, isLoading } = useSWR('/api/stats', fetcher);

    if (isLoading) return (
        <div className="p-4 lg:p-6 space-y-6">
            <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
        </div>
    );

    const stats = data?.stats || [];
    const requests = (data?.recentRequests || []).map((r: any) => ({
        ...r,
        timeAgo: formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: tr })
    }));

    return (
        <div className="p-4 lg:p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Merhaba, {userName || "Organizasyon"} 👋</h1>
                <p className="text-gray-500 mt-1">Acente paneliniz ve bugünkü özetiniz.</p>
            </div>
            <CreditBalance />
            <StatCards stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <h3 className="font-semibold text-lg mb-2">Talep Havuzu</h3>
                            <p className="text-gray-600 mb-4">
                                Mevcut talepleri görmek ve teklif vermek için Talep Pazarı'nı ziyaret edin.
                            </p>
                            <button
                                onClick={() => window.location.href = '/dashboard/market'}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                Talep Pazarı'na Git
                            </button>
                        </div>
                    </div>
                </div>
                <div>
                    <MyOffers />
                </div>
            </div>
            <QuickActions />
        </div>
    )
}

import { MyRequests } from "@/components/pilgrim-dashboard/my-requests";

function PilgrimDashboard({ userName }: { userName: string }) {
    return (
        <div className="p-4 lg:p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Hoşgeldiniz, {userName || "Değerli Misafirimiz"} 🕋</h1>
                <p className="text-gray-500 mt-1">Umre yolculuğunuz için size en uygun turları buradan takip edebilirsiniz.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-6">
                    {/* Active Requests */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <MyRequests />
                        <div className="mt-4 border-t pt-4">
                            <button
                                onClick={() => window.location.href = '/dashboard/requests/new'}
                                className="w-full sm:w-auto text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">+</span> Yeni Talep Oluştur
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-span-1">
                    <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm sticky top-6">
                        <h3 className="font-semibold text-lg mb-2">Favorilerim</h3>
                        <p className="text-sm text-gray-500">Favorilenmiş tur paketiniz yok.</p>
                        <button
                            onClick={() => window.location.href = '/tours'}
                            className="mt-4 text-sm font-medium text-primary hover:underline"
                        >Turları İncele &rarr;</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

import { MyOffers } from "@/components/guide-dashboard/my-offers";

function GuideDashboard({ userName }: { userName: string }) {
    const { data, isLoading } = useSWR('/api/stats', fetcher);

    if (isLoading) return (
        <div className="p-4 lg:p-6 space-y-6">
            <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
        </div>
    );

    const stats = data?.stats || [];
    const requests = (data?.recentRequests || []).map((r: any) => ({
        ...r,
        timeAgo: formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: tr })
    }));

    return (
        <div className="p-4 lg:p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Merhaba, {userName || "Rehber"} 🗺️</h1>
                <p className="text-gray-500 mt-1">Rehberlik paneli ve bugünkü özetiniz.</p>
            </div>
            <CreditBalance />
            <StatCards stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <h3 className="font-semibold text-lg mb-2">Talep Havuzu</h3>
                            <p className="text-gray-600 mb-4">
                                Mevcut talepleri görmek ve teklif vermek için Talep Pazarı'nı ziyaret edin.
                            </p>
                            <button
                                onClick={() => window.location.href = '/dashboard/market'}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                Talep Pazarı'na Git
                            </button>
                        </div>
                    </div>
                </div>
                <div>
                    <MyOffers />
                </div>
            </div>
            <QuickActions />
        </div>
    )
}

// --- Main Page ---

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === 'loading') {
        return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
    }

    if (status === 'unauthenticated') {
        router.push('/login');
        return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
    }

    const role = session?.user?.role;
    const userName = session?.user?.name || "";

    return (
        <DashboardLayout>
            {role === 'ORGANIZATION' && <OrganizerDashboard userName={userName} />}
            {role === 'USER' && <PilgrimDashboard userName={userName} />}
            {role === 'GUIDE' && <GuideDashboard userName={userName} />}
            {/* Fallback for safety */}
            {!['ORGANIZATION', 'USER', 'GUIDE'].includes(role || '') && <PilgrimDashboard userName={userName} />}
        </DashboardLayout>
    );
}
