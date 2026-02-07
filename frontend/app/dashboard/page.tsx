'use client';

import { Eye, MousePointer, MessageSquare, TrendingUp } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCards } from '@/components/dashboard/StatCards';
import { RequestList } from '@/components/dashboard/RequestCard';
import { QuickActions } from '@/components/dashboard/QuickActions';

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

function OrganizerDashboard({ userName }: { userName: string }) {
    return (
        <div className="p-4 lg:p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Merhaba, {userName || "Organizasyon"} 👋</h1>
                <p className="text-gray-500 mt-1">Acente paneliniz ve bugünkü özetiniz.</p>
            </div>
            <StatCards stats={mockStats} />
            <QuickActions />
            <RequestList requests={mockRequests} showViewAll={true} />
        </div>
    )
}

function PilgrimDashboard({ userName }: { userName: string }) {
    return (
        <div className="p-4 lg:p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Hoşgeldiniz, {userName || "Değerli Misafirimiz"} 🕋</h1>
                <p className="text-gray-500 mt-1">Umre yolculuğunuz için size en uygun turları buradan takip edebilirsiniz.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-lg mb-2">Talep Durumu</h3>
                    <p className="text-sm text-gray-500">Henüz aktif bir tur talebiniz bulunmuyor.</p>
                    <button className="mt-4 text-sm font-medium text-primary hover:underline">Yeni Talep Oluştur &rarr;</button>
                </div>
                <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-lg mb-2">Favorilerim</h3>
                    <p className="text-sm text-gray-500">Favorilenmiş tur paketiniz yok.</p>
                    <button className="mt-4 text-sm font-medium text-primary hover:underline">Turları İncele &rarr;</button>
                </div>
            </div>
        </div>
    )
}

import { CreateListingForm } from "@/components/guide-dashboard/create-listing-form";
import { MyListings } from "@/components/guide-dashboard/my-listings";

function GuideDashboard({ userName }: { userName: string }) {
    return (
        <div className="p-4 lg:p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Merhaba, {userName || "Rehber"} 🗺️</h1>
                <p className="text-gray-500 mt-1">Rehberlik paneli.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div>
                    <CreateListingForm />
                </div>
                <div>
                    <MyListings />
                </div>
            </div>
        </div>
    )
}

// --- Main Page ---

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated' && session?.user?.requires_onboarding) {
            router.replace('/onboarding');
        }
    }, [status, session, router]);

    if (status === 'loading' || (status === 'authenticated' && session?.user?.requires_onboarding)) {
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
