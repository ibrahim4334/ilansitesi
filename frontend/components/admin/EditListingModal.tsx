'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';

interface EditModalProps {
    listing: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditListingModal({ listing, onClose, onSuccess }: EditModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: listing.title,
        price: listing.price,
        quota: listing.quota,
        active: listing.active,
        approvalStatus: listing.approvalStatus
    });
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const res = await fetch(`/api/admin/listings/${listing.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Güncelleme başarısız');

            onSuccess();
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900 rounded-t-xl z-10">
                    <h3 className="text-lg font-bold text-white">İlan Düzenle</h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm">
                            {errorMsg}
                        </div>
                    )}

                    <form id="edit-listing-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">İlan Başlığı</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Fiyat (₺)</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Kontenjan</label>
                                <input
                                    type="number"
                                    value={formData.quota}
                                    onChange={e => setFormData({ ...formData, quota: Number(e.target.value) })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Yayında mı?</label>
                                <select
                                    value={String(formData.active)}
                                    onChange={e => setFormData({ ...formData, active: e.target.value === 'true' })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                    <option value="true">Evet (Aktif)</option>
                                    <option value="false">Hayır (Pasif)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Onay Durumu</label>
                                <select
                                    value={formData.approvalStatus}
                                    onChange={e => setFormData({ ...formData, approvalStatus: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                    <option value="PENDING">Bekliyor (PENDING)</option>
                                    <option value="APPROVED">Onaylı (APPROVED)</option>
                                    <option value="REJECTED">Reddedildi (REJECTED)</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-800 flex justify-end gap-3 rounded-b-xl bg-gray-900">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        disabled={loading}
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        form="edit-listing-form"
                        disabled={loading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}
