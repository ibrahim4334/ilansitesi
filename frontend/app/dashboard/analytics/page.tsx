'use client';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PerformanceChart, ConversionFunnel, TrafficSources } from '@/components/dashboard/AnalyticsCharts';

const viewsData = [
    { label: 'Pzt', value: 234 },
    { label: 'Sal', value: 345 },
    { label: 'Çar', value: 289 },
    { label: 'Per', value: 456 },
    { label: 'Cum', value: 523 },
    { label: 'Cmt', value: 412 },
    { label: 'Paz', value: 387 },
];

const funnelData = [
    { label: 'Görüntüleme', value: 10000 },
    { label: 'Detay Sayfası', value: 4500, percentage: 45 },
    { label: 'Talep Formu', value: 540, percentage: 12 },
    { label: 'Rezervasyon', value: 227, percentage: 42 },
];

const trafficData = [
    { name: 'Doğrudan', percentage: 45, color: 'bg-blue-500' },
    { name: 'Arama', percentage: 30, color: 'bg-green-500' },
    { name: 'Sosyal', percentage: 15, color: 'bg-purple-500' },
    { name: 'Diğer', percentage: 10, color: 'bg-gray-400' },
];

export default function AnalyticsPage() {
    return (
        <DashboardLayout>
            <div className="p-4 lg:p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Performans</h1>
                    <select className="border rounded-lg px-3 py-2 text-sm bg-white">
                        <option>Son 7 Gün</option>
                        <option>Son 30 Gün</option>
                        <option>Son 90 Gün</option>
                    </select>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PerformanceChart data={viewsData} title="Haftalık Görüntülenme" />
                    <TrafficSources sources={trafficData} />
                </div>

                {/* Funnel */}
                <ConversionFunnel stages={funnelData} />

                {/* Top Listings Table */}
                <div className="bg-white rounded-xl border">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold text-gray-900">En İyi Performans Gösteren İlanlar</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">İlan</th>
                                    <th className="px-4 py-3 text-right">Görüntülenme</th>
                                    <th className="px-4 py-3 text-right">Tıklama</th>
                                    <th className="px-4 py-3 text-right">CTR</th>
                                    <th className="px-4 py-3 text-right">Talep</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">Lüks Umre Turu</td>
                                    <td className="px-4 py-3 text-right">2,456</td>
                                    <td className="px-4 py-3 text-right">201</td>
                                    <td className="px-4 py-3 text-right text-green-600">8.2%</td>
                                    <td className="px-4 py-3 text-right">23</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">Ramazan Umresi</td>
                                    <td className="px-4 py-3 text-right">1,823</td>
                                    <td className="px-4 py-3 text-right">145</td>
                                    <td className="px-4 py-3 text-right text-green-600">7.9%</td>
                                    <td className="px-4 py-3 text-right">18</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">Ekonomik Paket</td>
                                    <td className="px-4 py-3 text-right">1,234</td>
                                    <td className="px-4 py-3 text-right">87</td>
                                    <td className="px-4 py-3 text-right text-yellow-600">7.0%</td>
                                    <td className="px-4 py-3 text-right">12</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
