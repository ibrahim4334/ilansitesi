'use client';

import { useEffect, useState } from 'react';
import { Check, Crown, Zap, AlertCircle } from 'lucide-react';
import { TIERS, TIER_DISPLAY_CONFIG, type AccessInfo, type TierType } from '@/lib/tier-config';

// ======================================
// PRICING TABLE (Backend Aligned)
// ======================================

interface PricingTableProps {
    currentTier?: TierType;
    onUpgrade?: (tier: TierType) => void;
}

export function PricingTable({ currentTier = TIERS.FREE, onUpgrade }: PricingTableProps) {
    const plans = [
        TIER_DISPLAY_CONFIG.free,
        TIER_DISPLAY_CONFIG.plus,
        TIER_DISPLAY_CONFIG.pro
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
                const isCurrent = currentTier === plan.id;
                const isPopular = plan.popular;

                return (
                    <div
                        key={plan.id}
                        className={`relative rounded-2xl p-6 transition-all duration-200 ${isPopular
                            ? 'bg-white ring-2 ring-purple-600 shadow-xl scale-105'
                            : 'bg-white border border-gray-200 shadow-sm'
                            } ${isCurrent ? 'bg-gray-50' : ''}`}
                    >
                        {isPopular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                    <Zap size={12} fill="currentColor" />
                                    EN POPÜLER
                                </span>
                            </div>
                        )}

                        <div className="text-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                            <div className="mt-2 mb-1">
                                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                            </div>
                            <p className="text-sm text-gray-500">{plan.description}</p>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                    <Check className={`w-5 h-5 flex-shrink-0 ${isPopular ? 'text-purple-600' : 'text-green-600'}`} />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => onUpgrade?.(plan.id)}
                            disabled={isCurrent}
                            className={`w-full py-3 rounded-xl font-semibold transition-all ${isCurrent
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : isPopular
                                    ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg'
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                        >
                            {isCurrent ? 'Mevcut Planınız' : plan.cta}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

// ======================================
// QUOTA STATUS (API Driven)
// ======================================

export function QuotaStatus() {
    const [access, setAccess] = useState<AccessInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/wp-json/umrebuldum/v1/access')
            .then(res => res.json())
            .then((data: AccessInfo) => {
                setAccess(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('API Error:', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="h-12 bg-gray-100 animate-pulse rounded-lg"></div>;
    if (!access) return null;

    // Unlimited User
    if (access.daily_limit === null) {
        return (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4 flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                    <Crown size={20} />
                </div>
                <div>
                    <h4 className="font-semibold text-purple-900">Sınırsız Erişim Aktif</h4>
                    <p className="text-sm text-purple-700">Tüm PRO özellikler kullanımınıza hazır.</p>
                </div>
            </div>
        );
    }

    // Free User with Quota
    const percentage = Math.min(100, (access.daily_used / access.daily_limit) * 100);
    const isLimitReached = access.daily_used >= access.daily_limit;

    return (
        <div className="bg-white border boundary-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">Günlük Limit</span>
                <span className="text-sm font-semibold text-gray-900">
                    {access.daily_used} / {access.daily_limit}
                </span>
            </div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                    className={`h-full transition-all duration-500 rounded-full ${isLimitReached ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {isLimitReached ? (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                    <AlertCircle size={16} />
                    <span>Limit doldu. Yarına kadar bekleyin veya yükseltin.</span>
                </div>
            ) : (
                <p className="text-xs text-gray-500">
                    Kalan hakkınız: {access.daily_limit - access.daily_used} poster
                </p>
            )}
        </div>
    );
}

// ======================================
// FEATURE GATE (Logic-less)
// ======================================

interface FeatureGateProps {
    feature: keyof AccessInfo['features'];
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export function FeatureGate({ feature, fallback = null, children }: FeatureGateProps) {
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    useEffect(() => {
        // Check sessionStorage first for cache
        const cached = sessionStorage.getItem('ube_access');
        if (cached) {
            const data = JSON.parse(cached) as AccessInfo;
            setHasAccess(data.features[feature]);
        }

        // Fetch fresh
        fetch('/wp-json/umrebuldum/v1/access')
            .then(res => res.json())
            .then((data: AccessInfo) => {
                sessionStorage.setItem('ube_access', JSON.stringify(data));
                setHasAccess(data.features[feature]);
            })
            .catch(() => setHasAccess(false));
    }, [feature]);

    if (hasAccess === null) return null; // Loading state

    return hasAccess ? <>{children}</> : <>{fallback}</>;
}
