'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Search, Plus, Minus, Loader2, AlertTriangle, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface CreditTx {
    id: string;
    amount: number;
    type: string;
    reason: string;
    relatedId: string | null;
    createdAt: string;
}

interface UserData {
    id: string;
    name: string | null;
    email: string;
    role: string | null;
    guideName: string | null;
    package: string | null;
}

export default function CreditManagementPanel() {
    const [searchEmail, setSearchEmail] = useState('');
    const [searchedEmail, setSearchedEmail] = useState('');
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustReason, setAdjustReason] = useState('');
    const [adjusting, setAdjusting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const shouldFetch = searchedEmail.length > 0;
    const { data, error, isLoading, mutate } = useSWR(
        shouldFetch ? `/api/admin/credits?email=${encodeURIComponent(searchedEmail)}` : null,
        fetcher
    );

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (searchEmail.trim()) {
            setSearchedEmail(searchEmail.trim());
            setFeedback(null);
        }
    }

    async function handleAdjust() {
        const amount = parseInt(adjustAmount, 10);
        if (!amount || !adjustReason.trim() || !data?.user?.id) return;

        setAdjusting(true);
        setFeedback(null);
        try {
            const res = await fetch('/api/admin/credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId: data.user.id,
                    amount,
                    reason: adjustReason.trim(),
                }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'İşlem başarısız');
            setFeedback({ type: 'success', message: `${amount > 0 ? '+' : ''}${amount} kredi ${amount > 0 ? 'eklendi' : 'düşüldü'}. Yeni bakiye: ${result.newBalance}` });
            setAdjustAmount('');
            setAdjustReason('');
            mutate();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        } finally {
            setAdjusting(false);
        }
    }

    const user: UserData | null = data?.user || null;
    const balance: number = data?.balance ?? 0;
    const transactions: CreditTx[] = data?.transactions || [];

    return (
        <div className="space-y-6">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="email"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        placeholder="E-posta ile rehber/org ara..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    />
                </div>
                <button
                    type="submit"
                    disabled={!searchEmail.trim()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    Ara
                </button>
            </form>

            {feedback && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {feedback.message}
                </div>
            )}

            {isLoading && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Kullanıcı aranıyor...
                </div>
            )}

            {error && searchedEmail && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <p className="text-red-400 text-sm">Kullanıcı bulunamadı veya bir hata oluştu.</p>
                </div>
            )}

            {user && (
                <>
                    {/* User Info Card */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">{user.name || user.email}</h3>
                                <p className="text-sm text-gray-400">{user.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs font-medium">
                                        {user.role || 'No role'}
                                    </span>
                                    {user.guideName && (
                                        <span className="text-xs text-gray-500">Rehber: {user.guideName}</span>
                                    )}
                                    {user.package && (
                                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs font-medium">
                                            {user.package}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Bakiye</p>
                                <p className="text-2xl font-bold text-emerald-400">{balance}</p>
                                <p className="text-xs text-gray-500">kredi</p>
                            </div>
                        </div>
                    </div>

                    {/* Adjust Credits */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-500" />
                            Kredi Düzenle
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Miktar <span className="text-red-400">*</span></label>
                                <input
                                    type="number"
                                    value={adjustAmount}
                                    onChange={(e) => setAdjustAmount(e.target.value)}
                                    placeholder="+100 veya -50"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Sebep <span className="text-red-400">*</span></label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={adjustReason}
                                        onChange={(e) => setAdjustReason(e.target.value)}
                                        placeholder="Kredi düzenleme sebebi..."
                                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                    <button
                                        onClick={handleAdjust}
                                        disabled={!adjustAmount || parseInt(adjustAmount) === 0 || !adjustReason.trim() || adjusting}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                                    >
                                        {adjusting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                                        Uygula
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div>
                        <h4 className="font-semibold text-gray-200 mb-3">İşlem Geçmişi ({transactions.length})</h4>
                        {transactions.length === 0 ? (
                            <p className="text-gray-500 text-sm">Henüz işlem geçmişi yok.</p>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-800">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Tarih</th>
                                            <th className="px-4 py-3 text-left font-medium">Tip</th>
                                            <th className="px-4 py-3 text-left font-medium">Miktar</th>
                                            <th className="px-4 py-3 text-left font-medium">Sebep</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-gray-900/50 transition-colors">
                                                <td className="px-4 py-3 text-gray-400 text-xs">
                                                    {new Date(tx.createdAt).toLocaleString('tr-TR')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`flex items-center gap-1 font-medium ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                                                        }`}>
                                                        {tx.amount > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">
                                                    {tx.reason}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {!shouldFetch && (
                <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Kullanıcı aramak için e-posta girin</p>
                </div>
            )}
        </div>
    );
}
