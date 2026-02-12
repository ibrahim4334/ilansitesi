'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { AlertTriangle, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface AuditLog {
    id: string;
    adminId: string;
    action: string;
    targetId: string;
    reason: string;
    metadata: Record<string, any> | null;
    createdAt: string;
}

const actionLabels: Record<string, { label: string; color: string }> = {
    approve_listing: { label: 'İlan Onay', color: 'bg-emerald-500/10 text-emerald-400' },
    reject_listing: { label: 'İlan Red', color: 'bg-red-500/10 text-red-400' },
    adjust_credits: { label: 'Kredi', color: 'bg-blue-500/10 text-blue-400' },
    ban_user: { label: 'Ban', color: 'bg-red-500/10 text-red-400' },
    delete_request: { label: 'Talep Sil', color: 'bg-yellow-500/10 text-yellow-400' },
};

export default function AuditLogPanel() {
    const [page, setPage] = useState(1);
    const { data, error, isLoading, mutate } = useSWR(`/api/admin/audit-logs?page=${page}&limit=25`, fetcher);

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">Veriler yüklenemedi</p>
                <button onClick={() => mutate()} className="ml-auto px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-sm transition-colors">
                    Tekrar Dene
                </button>
            </div>
        );
    }

    const logs: AuditLog[] = data?.logs || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Toplam {pagination.total} kayıt</p>
            </div>

            {logs.length === 0 ? (
                <div className="text-center py-12">
                    <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Henüz işlem kaydı yok</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-800">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Tarih</th>
                                <th className="px-4 py-3 text-left font-medium">İşlem</th>
                                <th className="px-4 py-3 text-left font-medium">Admin ID</th>
                                <th className="px-4 py-3 text-left font-medium">Hedef ID</th>
                                <th className="px-4 py-3 text-left font-medium">Sebep</th>
                                <th className="px-4 py-3 text-left font-medium">Meta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {logs.map((log) => {
                                const actionInfo = actionLabels[log.action] || { label: log.action, color: 'bg-gray-700 text-gray-300' };
                                return (
                                    <tr key={log.id} className="hover:bg-gray-900/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString('tr-TR')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${actionInfo.color}`}>
                                                {actionInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                                            {log.adminId.slice(0, 8)}...
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                                            {log.targetId.slice(0, 8)}...
                                        </td>
                                        <td className="px-4 py-3 text-gray-300 text-xs max-w-xs truncate">
                                            {log.reason}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                                            {log.metadata ? JSON.stringify(log.metadata) : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-400">
                        Sayfa {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={page >= pagination.totalPages}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
