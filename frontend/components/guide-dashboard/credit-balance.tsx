"use client";

import { Button } from "@/components/ui/button";
import { Wallet, Shield, Star, Loader2 } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const CREDIT_BALANCE_KEY = "/api/guide/topup";

export function CreditBalance() {
    const { data: balanceData, isLoading: balLoading } = useSWR(CREDIT_BALANCE_KEY, fetcher);
    const { data: profileData, isLoading: profLoading } = useSWR('/api/guide/profile', fetcher);

    const isLoading = balLoading || profLoading;
    const credits = balanceData?.credits ?? profileData?.credits ?? 0;
    const trustScore = profileData?.trustScore ?? 0;
    const pkg = profileData?.package || "FREEMIUM";
    const completedTrips = profileData?.completedTrips ?? 0;

    if (isLoading) {
        return (
            <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 animate-pulse">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 flex gap-6">
                            <div className="h-16 w-24 bg-blue-100 rounded-xl" />
                            <div className="h-16 w-24 bg-blue-100 rounded-xl" />
                            <div className="h-16 w-24 bg-blue-100 rounded-xl" />
                        </div>
                        <div className="h-10 w-32 bg-blue-100 rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    const trustColor = trustScore >= 70
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : trustScore >= 40
            ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
            : 'text-red-700 bg-red-50 border-red-200';

    const pkgColors: Record<string, string> = {
        FREEMIUM: 'bg-gray-100 text-gray-600 border-gray-200',
        PREMIUM: 'bg-blue-50 text-blue-700 border-blue-200',
        PROFESSIONAL: 'bg-purple-50 text-purple-700 border-purple-200',
        LEGEND: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    return (
        <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 rounded-2xl p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Stats Grid */}
                    <div className="flex-1 flex flex-wrap gap-4 sm:gap-6">
                        {/* Credit Balance */}
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 p-2.5 rounded-xl">
                                <Wallet className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bakiye</p>
                                <p className="text-2xl font-bold text-gray-900">{credits} <span className="text-sm font-normal text-gray-500">kredi</span></p>
                            </div>
                        </div>

                        {/* Trust Score */}
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border ${trustColor}`}>
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Güven Puanı</p>
                                <p className="text-2xl font-bold text-gray-900">{trustScore}</p>
                            </div>
                        </div>

                        {/* Package */}
                        <div className="flex items-center gap-3">
                            <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${pkgColors[pkg] || pkgColors.FREEMIUM}`}>
                                <Star className="w-3 h-3 inline mr-1" />
                                {pkg}
                            </div>
                            {completedTrips > 0 && (
                                <span className="text-xs text-gray-500">{completedTrips} tur tamamlandı</span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button asChild variant="default" className="bg-amber-600 hover:bg-amber-700 text-white flex-1 sm:flex-initial">
                            <Link href="/dashboard/billing">
                                <Wallet className="w-4 h-4 mr-1.5" />
                                Kredi Yükle
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="flex-1 sm:flex-initial">
                            <Link href="/dashboard/credits">
                                İşlem Geçmişi
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
