'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Loader2, Edit, AlertCircle, CheckCircle, Search } from 'lucide-react';
import EditListingModal from './EditListingModal';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AllListingsPanel() {
    const [searchTerm, setSearchTerm] = useState('');
    const { data, error, isLoading, mutate } = useSWR(`/api/admin/listings?search=${searchTerm}`, fetcher);
    const [editingListing, setEditingListing] = useState<any | null>(null);

    const listings = data?.listings || [];

    if (error) return <div className="p-4 text-red-500 bg-red-50 rounded-lg">Veriler yüklenirken bir hata oluştu.</div>;

    const handleSuccessEdit = () => {
        setEditingListing(null);
        mutate();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="İlan veya rehber ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : listings.length === 0 ? (
                <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-xl">
                    <p className="text-gray-400">Aranan kriterlere uygun ilan bulunamadı.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-900">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">İlan Başlığı</th>
                                <th className="px-4 py-3 font-medium">Rehber</th>
                                <th className="px-4 py-3 font-medium">Durum</th>
                                <th className="px-4 py-3 font-medium">Fiyat/Kota</th>
                                <th className="px-4 py-3 font-medium text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {listings.map((listing: any) => (
                                <tr key={listing.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-200">{listing.title}</div>
                                        <div className="text-xs text-gray-500">{new Date(listing.createdAt).toLocaleDateString('tr-TR')} • {listing.departureCity || 'Konumsuz'}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-300">{listing.guideName}</div>
                                        <div className="text-xs text-gray-500">{listing.guideEmail}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                            {/* Active Status */}
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${listing.active ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                                {listing.active ? 'YAYINDA' : 'PASİF'}
                                            </span>
                                            {/* Approval Status */}
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${listing.approvalStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    listing.approvalStatus === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                                                        'bg-red-500/10 text-red-400'
                                                }`}>
                                                {listing.approvalStatus}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">
                                        <div>{listing.price} ₺</div>
                                        <div className="text-xs text-gray-500">{listing.filled} / {listing.quota} Kişi</div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => setEditingListing(listing)}
                                            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors"
                                            title="Düzenle"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editingListing && (
                <EditListingModal
                    listing={editingListing}
                    onClose={() => setEditingListing(null)}
                    onSuccess={handleSuccessEdit}
                />
            )}
        </div>
    );
}
