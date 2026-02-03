import Link from 'next/link';
import { Eye, MoreVertical, Edit, Image, EyeOff, Trash2, Share2, Star } from 'lucide-react';
import { useState } from 'react';

interface Listing {
    id: string;
    title: string;
    thumbnail?: string;
    status: 'active' | 'draft' | 'pending' | 'expired';
    views: number;
    rating?: number;
    reviewCount?: number;
    price?: string;
}

interface ListingCardProps {
    listing: Listing;
    onAction?: (action: string, listingId: string) => void;
}

export function ListingCard({ listing, onAction }: ListingCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    const statusConfig = {
        active: { label: 'Aktif', color: 'bg-green-100 text-green-700' },
        draft: { label: 'Taslak', color: 'bg-gray-100 text-gray-700' },
        pending: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-700' },
        expired: { label: 'Süresi Doldu', color: 'bg-red-100 text-red-700' },
    };

    const status = statusConfig[listing.status];

    return (
        <div className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex gap-3 p-3">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                    {listing.thumbnail ? (
                        <img src={listing.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Image className="w-8 h-8" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{listing.title}</h4>
                            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${status.color}`}>
                                {status.label}
                            </span>
                        </div>

                        {/* Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg"
                            >
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>

                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                                    <div className="absolute right-0 top-8 w-40 bg-white border rounded-lg shadow-lg z-20 py-1">
                                        <button
                                            onClick={() => { onAction?.('feature', listing.id); setMenuOpen(false); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                                        >
                                            <Star className="w-4 h-4" /> Öne Çıkar
                                        </button>
                                        <button
                                            onClick={() => { onAction?.('share', listing.id); setMenuOpen(false); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                                        >
                                            <Share2 className="w-4 h-4" /> Paylaş
                                        </button>
                                        <hr className="my-1" />
                                        <button
                                            onClick={() => { onAction?.('delete', listing.id); setMenuOpen(false); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" /> Sil
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {listing.views.toLocaleString()}
                        </span>
                        {listing.rating && (
                            <span className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                {listing.rating} ({listing.reviewCount})
                            </span>
                        )}
                        {listing.price && (
                            <span className="font-medium text-gray-900">{listing.price}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t px-3 py-2 flex gap-2">
                <Link
                    href={`/dashboard/listings/${listing.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                    <Edit className="w-4 h-4" /> Düzenle
                </Link>
                <Link
                    href={`/dashboard/listings/${listing.id}/poster`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                    <Image className="w-4 h-4" /> Afiş
                </Link>
                <button
                    onClick={() => onAction?.(listing.status === 'active' ? 'hide' : 'show', listing.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                    <EyeOff className="w-4 h-4" /> {listing.status === 'active' ? 'Gizle' : 'Göster'}
                </button>
            </div>
        </div>
    );
}

interface ListingListProps {
    listings: Listing[];
    onAction?: (action: string, listingId: string) => void;
}

export function ListingList({ listings, onAction }: ListingListProps) {
    return (
        <div className="space-y-3">
            {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onAction={onAction} />
            ))}
        </div>
    );
}
