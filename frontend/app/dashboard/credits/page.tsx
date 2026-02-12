'use client';

import useSWR from 'swr';
import { ArrowUpRight, ArrowDownRight, Wallet, Loader2, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const typeLabels: Record<string, { label: string; color: string }> = {
    topup: { label: 'Yükleme', color: 'bg-emerald-50 text-emerald-700' },
    spend: { label: 'Harcama', color: 'bg-red-50 text-red-700' },
    grant: { label: 'Hediye', color: 'bg-blue-50 text-blue-700' },
    refund: { label: 'İade', color: 'bg-amber-50 text-amber-700' },
    deduct: { label: 'Kesinti', color: 'bg-red-50 text-red-700' },
    admin_grant: { label: 'Admin', color: 'bg-purple-50 text-purple-700' },
    admin_deduct: { label: 'Admin Kesinti', color: 'bg-red-50 text-red-700' },
};

export default function CreditHistoryPage() {
    const { data, error, isLoading } = useSWR('/api/guide/credits', fetcher);

    const balance = data?.balance ?? 0;
    const transactions = data?.transactions || [];

    return (
        <DashboardLayout>
            <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kredi İşlem Geçmişi</h1>
                    <p className="text-gray-500 mt-1">Tüm kredi hareketlerinizi buradan takip edebilirsiniz.</p>
                </div>

                {/* Balance Card */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 p-3 rounded-xl">
                            <Wallet className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Mevcut Bakiye</p>
                            <p className="text-3xl font-bold text-gray-900">{balance} <span className="text-base font-normal text-gray-500">kredi</span></p>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="space-y-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                        <p className="text-red-600 text-sm">Veriler yüklenemedi. Lütfen sayfayı yenileyin.</p>
                    </div>
                )}

                {/* Empty */}
                {!isLoading && !error && transactions.length === 0 && (
                    <div className="bg-white border rounded-xl p-12 text-center">
                        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-700">Henüz işlem yok</h3>
                        <p className="text-sm text-gray-500 mt-1">Kredi yükledikçe veya harcadıkça işlem geçmişiniz burada görünecek.</p>
                    </div>
                )}

                {/* Transaction List */}
                {!isLoading && !error && transactions.length > 0 && (
                    <div className="bg-white border rounded-xl overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {transactions.map((tx: any) => {
                                const typeInfo = typeLabels[tx.type] || { label: tx.type, color: 'bg-gray-50 text-gray-700' };
                                const isPositive = tx.amount > 0;
                                return (
                                    <div key={tx.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                        {/* Icon */}
                                        <div className={`p-2 rounded-xl ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                            {isPositive
                                                ? <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                                                : <ArrowDownRight className="w-5 h-5 text-red-500" />
                                            }
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                                                    {typeInfo.label}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true, locale: tr })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 truncate">{tx.reason}</p>
                                        </div>

                                        {/* Amount */}
                                        <div className={`text-lg font-bold whitespace-nowrap ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {isPositive ? '+' : ''}{tx.amount}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
