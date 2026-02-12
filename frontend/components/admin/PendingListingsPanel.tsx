'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface PendingListing {
    id: string;
    title: string;
    guideName: string;
    guideEmail: string;
    price: number;
    createdAt: string;
    trustScore: number;
    isFeatured: boolean;
    departureCity: string;
    city: string;
}

export default function PendingListingsPanel() {
    const { data, error, isLoading, mutate } = useSWR('/api/admin/pending-listings', fetcher);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<{ listingId: string; title: string } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    async function handleApprove(listingId: string) {
        setActionLoading(listingId);
        setFeedback(null);
        try {
            const res = await fetch('/api/admin/approve-listing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId, action: 'APPROVE', reason: 'Admin approved' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Onay başarısız');
            setFeedback({ type: 'success', message: `İlan onaylandı` });
            mutate();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        } finally {
            setActionLoading(null);
        }
    }

    async function handleReject() {
        if (!rejectModal || !rejectReason.trim()) return;
        setActionLoading(rejectModal.listingId);
        setFeedback(null);
        try {
            const res = await fetch('/api/admin/reject-listing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId: rejectModal.listingId, reason: rejectReason.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Red başarısız');
            setFeedback({ type: 'success', message: `İlan reddedildi` });
            setRejectModal(null);
            setRejectReason('');
            mutate();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        } finally {
            setActionLoading(null);
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                    <p className="text-red-400 font-medium">Veri yüklenemedi</p>
                    <p className="text-red-400/70 text-sm">Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
                </div>
                <button onClick={() => mutate()} className="ml-auto px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-sm transition-colors">
                    Tekrar Dene
                </button>
            </div>
        );
    }

    const listings: PendingListing[] = data?.listings || [];

    return (
        <div className="space-y-4">
            {feedback && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {feedback.message}
                </div>
            )}

            {listings.length === 0 ? (
                <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Bekleyen ilan yok</p>
                    <p className="text-gray-600 text-sm mt-1">Tüm ilanlar onaylanmış durumda.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-800">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">İlan</th>
                                <th className="px-4 py-3 text-left font-medium">Rehber / Org</th>
                                <th className="px-4 py-3 text-left font-medium">Fiyat</th>
                                <th className="px-4 py-3 text-left font-medium">Tarih</th>
                                <th className="px-4 py-3 text-left font-medium">Güven Puanı</th>
                                <th className="px-4 py-3 text-right font-medium">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {listings.map((listing) => (
                                <tr key={listing.id} className="hover:bg-gray-900/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-gray-200">{listing.title}</p>
                                            <p className="text-xs text-gray-500">{listing.departureCity} → {listing.city}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-gray-300">{listing.guideName}</p>
                                        <p className="text-xs text-gray-500">{listing.guideEmail}</p>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300 font-medium">
                                        {listing.price?.toLocaleString('tr-TR')} ₺
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {new Date(listing.createdAt).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${listing.trustScore >= 70 ? 'bg-emerald-500/10 text-emerald-400' :
                                                listing.trustScore >= 40 ? 'bg-yellow-500/10 text-yellow-400' :
                                                    'bg-red-500/10 text-red-400'
                                            }`}>
                                            {listing.trustScore}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleApprove(listing.id)}
                                                disabled={actionLoading === listing.id}
                                                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {actionLoading === listing.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                Onayla
                                            </button>
                                            <button
                                                onClick={() => setRejectModal({ listingId: listing.id, title: listing.title })}
                                                disabled={actionLoading === listing.id}
                                                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                                            >
                                                <XCircle className="w-3 h-3" />
                                                Reddet
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Reject Reason Modal */}
            {rejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70" onClick={() => { setRejectModal(null); setRejectReason(''); }} />
                    <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-1">İlanı Reddet</h3>
                        <p className="text-sm text-gray-400 mb-4">"{rejectModal.title}" ilanı reddedilecek.</p>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Red Sebebi <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Red sebebini yazınız..."
                            rows={3}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || actionLoading === rejectModal.listingId}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                            >
                                {actionLoading === rejectModal.listingId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Reddet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
