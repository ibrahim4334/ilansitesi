import { Wallet, CreditCard, TrendingUp, Calendar } from 'lucide-react';

interface RevenueCardProps {
    title: string;
    amount: string;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: number;
}

export function RevenueCard({ title, amount, subtitle, icon, trend }: RevenueCardProps) {
    return (
        <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-sm text-gray-500">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-gray-900">{amount}</p>
                        {trend !== undefined && (
                            <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trend >= 0 ? '+' : ''}{trend}%
                            </span>
                        )}
                    </div>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
}

interface RevenueSummaryProps {
    thisMonth: number;
    pending: number;
    totalReservations: number;
    lastPayout?: { amount: number; date: string };
}

export function RevenueSummary({ thisMonth, pending, totalReservations, lastPayout }: RevenueSummaryProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RevenueCard
                title="Bu Ay Gelir"
                amount={`₺${thisMonth.toLocaleString()}`}
                icon={<Wallet className="w-6 h-6" />}
                trend={12}
            />
            <RevenueCard
                title="Bekleyen Ödeme"
                amount={`₺${pending.toLocaleString()}`}
                subtitle="Sonraki ödeme: 15 Şubat"
                icon={<CreditCard className="w-6 h-6" />}
            />
            <RevenueCard
                title="Toplam Rezervasyon"
                amount={totalReservations.toString()}
                subtitle="Bu ay"
                icon={<TrendingUp className="w-6 h-6" />}
                trend={8}
            />
            {lastPayout && (
                <RevenueCard
                    title="Son Ödeme"
                    amount={`₺${lastPayout.amount.toLocaleString()}`}
                    subtitle={lastPayout.date}
                    icon={<Calendar className="w-6 h-6" />}
                />
            )}
        </div>
    );
}

interface PayoutHistoryItem {
    id: string;
    date: string;
    amount: number;
    status: 'completed' | 'pending' | 'processing';
}

interface PayoutHistoryProps {
    payouts: PayoutHistoryItem[];
}

export function PayoutHistory({ payouts }: PayoutHistoryProps) {
    const statusConfig = {
        completed: { label: 'Tamamlandı', color: 'text-green-600 bg-green-50' },
        pending: { label: 'Beklemede', color: 'text-yellow-600 bg-yellow-50' },
        processing: { label: 'İşleniyor', color: 'text-blue-600 bg-blue-50' },
    };

    return (
        <div className="bg-white rounded-xl border">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Ödeme Geçmişi</h3>
            </div>
            <div className="divide-y">
                {payouts.map((payout) => {
                    const status = statusConfig[payout.status];
                    return (
                        <div key={payout.id} className="p-4 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">₺{payout.amount.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">{payout.date}</p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                                {status.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
