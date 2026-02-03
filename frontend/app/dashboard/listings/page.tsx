'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ListingList } from '@/components/dashboard/ListingCard';

const mockListings = [
    {
        id: '1',
        title: 'Lüks Umre Turu - 15 Gün',
        status: 'active' as const,
        views: 2456,
        rating: 4.8,
        reviewCount: 23,
        price: '$1,500',
    },
    {
        id: '2',
        title: 'Ramazan Umresi Özel Paket',
        status: 'active' as const,
        views: 1823,
        rating: 4.9,
        reviewCount: 45,
        price: '$2,000',
    },
    {
        id: '3',
        title: 'Ekonomik Umre - 10 Gün',
        status: 'active' as const,
        views: 987,
        rating: 4.5,
        reviewCount: 12,
        price: '$900',
    },
    {
        id: '4',
        title: 'Aile Umre Paketi',
        status: 'draft' as const,
        views: 0,
        price: '$1,200',
    },
    {
        id: '5',
        title: 'VIP Umre Deneyimi',
        status: 'pending' as const,
        views: 0,
        price: '$3,500',
    },
];

const tabs = [
    { id: 'all', label: 'Tümü', count: 5 },
    { id: 'active', label: 'Aktif', count: 3 },
    { id: 'draft', label: 'Taslak', count: 1 },
    { id: 'pending', label: 'Beklemede', count: 1 },
    { id: 'expired', label: 'Süresi Dolmuş', count: 0 },
];

export default function ListingsPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredListings = mockListings.filter((listing) => {
        if (activeTab !== 'all' && listing.status !== activeTab) return false;
        if (searchQuery && !listing.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const handleAction = (action: string, listingId: string) => {
        console.log(`Action: ${action} on listing ${listingId}`);
        // Implement actions
    };

    return (
        <DashboardLayout>
            <div className="p-4 lg:p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">İlanlarım</h1>
                    <Link
                        href="/dashboard/listings/new"
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Yeni İlan</span>
                    </Link>
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
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-500' : 'bg-gray-200'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Listings */}
                {filteredListings.length > 0 ? (
                    <ListingList listings={filteredListings} onAction={handleAction} />
                ) : (
                    <div className="bg-white rounded-xl border p-8 text-center">
                        <p className="text-gray-500">Bu kategoride ilan bulunamadı</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
