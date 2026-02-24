'use client';

import { useState } from 'react';
import { Plus, Search, Loader2, Sparkles, FileX } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ListingList } from '@/components/dashboard/ListingCard';
import { CreditBalance } from '@/components/guide-dashboard/credit-balance';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const tabs = [
    { id: 'all', label: 'Tümü' },
    { id: 'approved', label: 'Aktif' },
    { id: 'pending', label: 'Beklemede' },
    { id: 'rejected', label: 'Reddedilen' },
    { id: 'draft', label: 'Taslak' },
];

const MAX_FEATURED = 3;

export default function ListingsPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: rawListings, error, isLoading, mutate } = useSWR(
        '/api/guide/my-listings',
        fetcher
    );

    const listings = (rawListings || []).map((l: any) => ({
        id: l.id,
        title: l.title,
        status: l.approvalStatus === 'PENDING' ? 'pending'
            : l.approvalStatus === 'REJECTED' ? 'rejected'
                : (l.active ? 'active' : 'draft'),
        views: l.views || 0,
        rating: l.rating,
        reviewCount: l.reviewCount,
        price: l.price ? `${l.price} ${l.pricing?.currency || 'SAR'}` : 'N/A',
        approvalStatus: l.approvalStatus,
        active: l.active,
        isFeatured: l.isFeatured || false,
        rejectionReason: l.rejectionReason || null,
        thumbnail: l.posterImages?.[0] || l.image
    }));

    const featuredCount = listings.filter((l: any) => l.isFeatured && l.status === 'active').length;

    const filteredListings = listings.filter((listing: any) => {
        if (activeTab === 'approved' && listing.status !== 'active') return false;
        if (activeTab === 'pending' && listing.status !== 'pending') return false;
        if (activeTab === 'rejected' && listing.status !== 'rejected') return false;
        if (activeTab === 'draft' && listing.status !== 'draft') return false;
        if (searchQuery && !listing.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const getCount = (tabId: string) => {
        if (!listings) return 0;
        if (tabId === 'all') return listings.length;
        if (tabId === 'approved') return listings.filter((l: any) => l.status === 'active').length;
        if (tabId === 'pending') return listings.filter((l: any) => l.status === 'pending').length;
        if (tabId === 'rejected') return listings.filter((l: any) => l.status === 'rejected').length;
        if (tabId === 'draft') return listings.filter((l: any) => l.status === 'draft').length;
        return 0;
    };

    const handleAction = async (action: string, listingId: string) => {
        if (action === 'delete') {
            if (!confirm('İlanı silmek istediğinize emin misiniz?')) return;
            try {
                const res = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
                if (res.ok) {
                    mutate(); // Refresh list
                    // toast.success('İlan silindi');
                } else {
                    alert('Silme işlemi başarısız.');
                }
            } catch (e) {
                console.error(e);
            }
        } else if (action === 'hide' || action === 'show') {
            try {
                const active = action === 'show';
                const res = await fetch(`/api/listings/${listingId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ active })
                });
                if (res.ok) mutate();
            } catch (e) {
                console.error(e);
            }
        } else if (action === 'share') {
            // Copy link
            const url = `${window.location.origin}/tours/${listingId}`;
            try {
                await navigator.clipboard.writeText(url);
                alert('Bağlantı kopyalandı!');
            } catch (err) {
                console.error('Copy failed', err);
            }
        } else if (action === 'feature') {
            if (!confirm('Bu ilanı öne çıkarmak için kredi bakiyenizden düşülecektir. Onaylıyor musunuz?')) return;
            try {
                const res = await fetch('/api/guide/feature', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ listingId })
                });
                const json = await res.json();
                if (res.ok) {
                    alert('İlan öne çıkarıldı!');
                    mutate();
                } else {
                    alert(json.message || 'Öne çıkarma başarısız.');
                }
            } catch (e) {
                console.error(e);
                alert('Bir hata oluştu.');
            }
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="p-4 lg:p-6 space-y-4">
                    <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
                    <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-4 lg:p-6 space-y-4">
                {/* Credit Balance Hero */}
                <CreditBalance />

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">İlanlarım</h1>
                    <div className="flex items-center gap-3">
                        {/* Featured Counter */}
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <span className="font-medium text-amber-800">
                                Öne Çıkan: {featuredCount}/{MAX_FEATURED}
                            </span>
                        </div>
                        <Link
                            href="/dashboard/listings/new"
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Yeni İlan</span>
                        </Link>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="İlan ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                    {tabs.map((tab) => {
                        const count = getCount(tab.id);
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? tab.id === 'rejected' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {tab.label}
                                {count > 0 && (
                                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.id
                                        ? tab.id === 'rejected' ? 'bg-red-500' : 'bg-blue-500'
                                        : 'bg-gray-200'
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Listings */}
                {filteredListings.length > 0 ? (
                    <ListingList listings={filteredListings} onAction={handleAction} guideImage={session?.user?.image} />
                ) : (
                    <div className="bg-white rounded-xl border p-12 text-center">
                        <FileX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-700">
                            {activeTab === 'rejected' ? 'Reddedilen ilan yok' : 'Bu kategoride ilan bulunamadı'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {activeTab === 'all' && listings.length === 0
                                ? 'Henüz ilan oluşturmadınız. İlk ilanınızı oluşturun!'
                                : 'Farklı bir filtre deneyin.'}
                        </p>
                        {activeTab === 'all' && listings.length === 0 && (
                            <Link
                                href="/dashboard/listings/new"
                                className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                İlk İlanı Oluştur
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
