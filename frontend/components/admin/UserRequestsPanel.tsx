'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Trash2, Loader2, AlertTriangle, Inbox } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface UmrahRequest {
    id: string;
    userEmail: string;
    departureCity: string;
    peopleCount: number;
    dateRange: string;
    roomType: string;
    budget: number | null;
    note: string | null;
    status: string;
    createdAt: string;
    interestCount: number;
    favoriteCount: number;
}

export default function UserRequestsPanel() {
    const { data, error, isLoading, mutate } = useSWR('/api/admin/requests', fetcher);
    const [deleteModal, setDeleteModal] = useState<UmrahRequest | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    async function handleDelete() {
        if (!deleteModal) return;
        setDeleting(true);
        setFeedback(null);
        try {
            const res = await fetch('/api/admin/requests', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: deleteModal.id, reason: 'Admin hard delete' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Silme başarısız');
            setFeedback({ type: 'success', message: 'Talep silindi' });
            setDeleteModal(null);
            mutate();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        } finally {
            setDeleting(false);
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
                <p className="text-red-400 text-sm">Veri yüklenemedi</p>
                <button onClick={() => mutate()} className="ml-auto px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-sm transition-colors">
                    Tekrar Dene
                </button>
            </div>
        );
    }

    const requests: UmrahRequest[] = data?.requests || [];

    return (
        <div className="space-y-4">
            {feedback && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {feedback.message}
                </div>
            )}

            {requests.length === 0 ? (
                <div className="text-center py-12">
                    <Inbox className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Hiç talep bulunamadı</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-800">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Kullanıcı</th>
                                <th className="px-4 py-3 text-left font-medium">Kalkış</th>
                                <th className="px-4 py-3 text-left font-medium">Kişi</th>
                                <th className="px-4 py-3 text-left font-medium">Tarih Aralığı</th>
                                <th className="px-4 py-3 text-left font-medium">Oda</th>
                                <th className="px-4 py-3 text-left font-medium">Bütçe</th>
                                <th className="px-4 py-3 text-left font-medium">Durum</th>
                                <th className="px-4 py-3 text-left font-medium">İlgi</th>
                                <th className="px-4 py-3 text-left font-medium">Oluşturma</th>
                                <th className="px-4 py-3 text-right font-medium">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {requests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-900/50 transition-colors">
                                    <td className="px-4 py-3 text-gray-300">{req.userEmail}</td>
                                    <td className="px-4 py-3 text-gray-400">{req.departureCity}</td>
                                    <td className="px-4 py-3 text-gray-400">{req.peopleCount}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">{req.dateRange}</td>
                                    <td className="px-4 py-3 text-gray-400">{req.roomType}</td>
                                    <td className="px-4 py-3 text-gray-400">
                                        {req.budget ? `${req.budget.toLocaleString('tr-TR')} ₺` : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${req.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-700 text-gray-400'
                                            }`}>
                                            {req.status === 'open' ? 'Açık' : 'Kapalı'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">{req.interestCount}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {new Date(req.createdAt).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => setDeleteModal(req)}
                                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ml-auto"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Sil
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteModal(null)} />
                    <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Talebi Sil</h3>
                                <p className="text-sm text-gray-400">Bu işlem geri alınamaz!</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-4">
                            <strong>{deleteModal.userEmail}</strong> tarafından oluşturulan talep kalıcı olarak silinecek. İlgili tüm ilgi beyanları ve favoriler de silinecektir.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteModal(null)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                            >
                                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Kalıcı Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
