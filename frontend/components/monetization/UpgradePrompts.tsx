import { Crown, Zap, TrendingUp, Gift, ArrowRight } from 'lucide-react';

// ============================================
// UPGRADE CTA BANNER (Sticky)
// ============================================

interface UpgradeBannerProps {
    variant?: 'default' | 'urgent' | 'discount';
    discount?: number;
    onUpgrade?: () => void;
}

export function UpgradeBanner({ variant = 'default', discount, onUpgrade }: UpgradeBannerProps) {
    if (variant === 'urgent') {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-red-600 to-orange-500 text-white py-3 px-4 shadow-lg">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 animate-pulse" />
                        <span className="font-medium">
                            Son 2 gün! Pro'ya geç, <strong>%{discount} indirim</strong> kazan
                        </span>
                    </div>
                    <button
                        onClick={onUpgrade}
                        className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors flex items-center gap-2"
                    >
                        Şimdi Al <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    if (variant === 'discount') {
        return (
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <Gift className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold">Özel Teklif: %{discount} İndirim</p>
                            <p className="text-sm text-purple-200">İlk 3 ay için geçerli</p>
                        </div>
                    </div>
                    <button
                        onClick={onUpgrade}
                        className="bg-white text-purple-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                    >
                        Teklifi Al
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 text-white rounded-xl p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-amber-400" />
                    <div>
                        <p className="font-semibold">Pro'ya yükselt, daha fazla müşteriye ulaş</p>
                        <p className="text-sm text-gray-400">Aylık sadece ₺199</p>
                    </div>
                </div>
                <button
                    onClick={onUpgrade}
                    className="bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 px-6 py-2.5 rounded-lg font-semibold hover:from-amber-500 hover:to-orange-600 transition-colors"
                >
                    Pro'ya Geç
                </button>
            </div>
        </div>
    );
}

// ============================================
// INLINE UPSELL (For forms & listings)
// ============================================

interface InlineUpsellProps {
    feature: 'featured' | 'priority' | 'boost' | 'analytics';
    onAction?: () => void;
}

export function InlineUpsell({ feature, onAction }: InlineUpsellProps) {
    const config = {
        featured: {
            icon: <TrendingUp className="w-5 h-5" />,
            title: 'İlanınızı Öne Çıkarın',
            description: '%40 daha fazla görüntülenme alın',
            cta: 'Öne Çıkar',
            price: '₺49',
            gradient: 'from-amber-400 to-orange-500',
        },
        priority: {
            icon: <Zap className="w-5 h-5" />,
            title: 'Öncelikli Talep',
            description: 'Organizatörler sizi ilk görsün',
            cta: 'Öncelikli Yap',
            price: '₺29',
            gradient: 'from-orange-500 to-red-500',
        },
        boost: {
            icon: <TrendingUp className="w-5 h-5" />,
            title: 'İlanı Boost Et',
            description: '7 gün boyunca üst sıralarda',
            cta: 'Boost Et',
            price: '₺99',
            gradient: 'from-blue-500 to-indigo-500',
        },
        analytics: {
            icon: <Crown className="w-5 h-5" />,
            title: 'Detaylı Analitik',
            description: 'Kimin ilanınızı görüntülediğini öğrenin',
            cta: 'Pro\'ya Geç',
            price: '₺199/ay',
            gradient: 'from-purple-500 to-indigo-600',
        },
    };

    const { icon, title, description, cta, price, gradient } = config[feature];

    return (
        <div className={`bg-gradient-to-r ${gradient} rounded-xl p-4 text-white`}>
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">{title}</h4>
                    <p className="text-sm opacity-90">{description}</p>
                </div>
                <button
                    onClick={onAction}
                    className="flex-shrink-0 bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    {cta} • {price}
                </button>
            </div>
        </div>
    );
}

// ============================================
// TESTIMONIAL CARD
// ============================================

interface TestimonialProps {
    quote: string;
    author: string;
    company: string;
    image?: string;
    metric?: { label: string; value: string };
}

export function Testimonial({ quote, author, company, image, metric }: TestimonialProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
            {metric && (
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {metric.value}
                    </div>
                    <span className="text-sm text-gray-500">{metric.label}</span>
                </div>
            )}

            <blockquote className="text-gray-700 mb-4">
                "{quote}"
            </blockquote>

            <div className="flex items-center gap-3">
                {image ? (
                    <img src={image} alt={author} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-semibold">
                        {author.charAt(0)}
                    </div>
                )}
                <div>
                    <p className="font-medium text-gray-900">{author}</p>
                    <p className="text-sm text-gray-500">{company}</p>
                </div>
            </div>
        </div>
    );
}

// ============================================
// COUNTDOWN TIMER
// ============================================

interface CountdownTimerProps {
    endDate: Date;
    label?: string;
}

export function CountdownTimer({ endDate, label = 'Kampanya bitimine' }: CountdownTimerProps) {
    // In real app, use state and interval to update
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const TimeBlock = ({ value, label }: { value: number; label: string }) => (
        <div className="text-center">
            <div className="bg-gray-900 text-white w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold">
                {value.toString().padStart(2, '0')}
            </div>
            <span className="text-xs text-gray-500 mt-1 block">{label}</span>
        </div>
    );

    return (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-center text-red-700 font-medium mb-3">{label}</p>
            <div className="flex items-center justify-center gap-2">
                <TimeBlock value={days} label="Gün" />
                <span className="text-2xl font-bold text-gray-400">:</span>
                <TimeBlock value={hours} label="Saat" />
                <span className="text-2xl font-bold text-gray-400">:</span>
                <TimeBlock value={minutes} label="Dakika" />
                <span className="text-2xl font-bold text-gray-400">:</span>
                <TimeBlock value={seconds} label="Saniye" />
            </div>
        </div>
    );
}

// ============================================
// FEATURE LIST (For Pro Benefits)
// ============================================

interface FeatureListProps {
    features: Array<{
        icon: React.ReactNode;
        title: string;
        description: string;
        isPro?: boolean;
    }>;
}

export function FeatureList({ features }: FeatureListProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
                <div
                    key={index}
                    className={`flex gap-4 p-4 rounded-xl ${feature.isPro
                            ? 'bg-purple-50 border border-purple-100'
                            : 'bg-gray-50'
                        }`}
                >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${feature.isPro
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                        {feature.icon}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            {feature.title}
                            {feature.isPro && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">PRO</span>
                            )}
                        </h4>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
