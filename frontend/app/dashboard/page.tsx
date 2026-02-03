'use client';

import { Eye, MousePointer, MessageSquare, TrendingUp } from 'lucide-react';
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

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <div className="p-4 lg:p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Merhaba, Hac Umre Turizm 👋</h1>
                    <p className="text-gray-500 mt-1">İşte bugünkü özetiniz</p>
                </div>

                {/* Stats */}
                <StatCards stats={mockStats} />

                {/* Quick Actions */}
                <QuickActions />

                {/* Recent Requests */}
                <RequestList requests={mockRequests} showViewAll={true} />
            </div>
        </DashboardLayout>
    );
}
