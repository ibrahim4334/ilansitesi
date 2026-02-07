import { Star, Zap, Crown, CheckCircle, TrendingUp, Sparkles } from 'lucide-react';

// ============================================
// FEATURED LISTING BADGES
// ============================================

interface FeaturedBadgeProps {
    type: 'featured' | 'premium' | 'popular' | 'verified' | 'editors-pick';
    size?: 'sm' | 'md' | 'lg';
}

export function FeaturedBadge({ type, size = 'md' }: FeaturedBadgeProps) {
    const config = {
        featured: {
            label: 'Öne Çıkan',
            icon: <Star className="w-3.5 h-3.5" />,
            className: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
        },
        premium: {
            label: 'Premium',
            icon: <Crown className="w-3.5 h-3.5" />,
            className: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
        },
        popular: {
            label: 'Popüler',
            icon: <TrendingUp className="w-3.5 h-3.5" />,
            className: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white',
        },
        verified: {
            label: 'Doğrulanmış',
            icon: <CheckCircle className="w-3.5 h-3.5" />,
            className: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
        },
        'editors-pick': {
            label: 'Editörün Seçimi',
            icon: <Sparkles className="w-3.5 h-3.5" />,
            className: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
        },
    };

    const sizes = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
    };

    const { label, icon, className } = config[type];

    return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full shadow-sm ${className} ${sizes[size]}`}>
            {icon}
            {label}
        </span>
    );
}

// ============================================
// LISTING CARD WITH PRO FEATURES
// ============================================

interface ListingCardProProps {
    title: string;
    price: string;
    image?: string;
    rating?: number;
    reviewCount?: number;
    isFeatured?: boolean;
    isPremium?: boolean;
    isVerified?: boolean;
    organizerName: string;
}

export function ListingCardPro({
    title,
    price,
    image,
    rating,
    reviewCount,
    isFeatured,
    isPremium,
    isVerified,
    organizerName,
}: ListingCardProProps) {
    return (
        <div className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 ${isPremium
            ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-100'
            : isFeatured
                ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-50'
                : 'border border-gray-200 hover:shadow-lg'
            }`}>
            {/* Premium Glow Effect */}
            {isPremium && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                {isPremium && <FeaturedBadge type="premium" size="sm" />}
                {isFeatured && !isPremium && <FeaturedBadge type="featured" size="sm" />}
                {isVerified && <FeaturedBadge type="verified" size="sm" />}
            </div>

            {/* Image */}
            <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                {image ? (
                    <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Star className="w-12 h-12" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {title}
                </h3>

                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                        {isVerified && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        {organizerName}
                    </span>
                </div>

                {rating && (
                    <div className="flex items-center gap-1 mt-2">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-medium">{rating}</span>
                        <span className="text-gray-400 text-sm">({reviewCount} değerlendirme)</span>
                    </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div>
                        <span className="text-xs text-gray-500">Kişi başı</span>
                        <p className="text-lg font-bold text-gray-900">{price}</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        İncele
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// REQUEST PRIORITY UPSELL
// ============================================

interface RequestPriorityUpsellProps {
    onUpgrade?: () => void;
    variant?: 'inline' | 'card' | 'modal';
}

export function RequestPriorityUpsell({ onUpgrade, variant = 'card' }: RequestPriorityUpsellProps) {
    if (variant === 'inline') {
        return (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
                <Zap className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                        <strong>Daha hızlı yanıt alın!</strong> Talebinizi öncelikli yapın.
                    </p>
                </div>
                <button
                    onClick={onUpgrade}
                    className="flex-shrink-0 px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
                >
                    +₺29
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">Talebinizi Öncelikli Yapın</h3>
            </div>

            <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    Organizatörlerin ilk gördüğü talepler arasında olun
                </li>
                <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    3 kat daha fazla yanıt alın
                </li>
                <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    Anlık bildirim gönderilsin
                </li>
            </ul>

            <div className="flex items-center justify-between">
                <div>
                    <span className="text-white/70 text-sm line-through">₺49</span>
                    <span className="text-2xl font-bold ml-2">₺29</span>
                </div>
                <button
                    onClick={onUpgrade}
                    className="px-6 py-2.5 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors"
                >
                    Öncelikli Yap
                </button>
            </div>
        </div>
    );
}

// ============================================
// PRICING COMPARISON TABLE
// ============================================

// PricingTable component has been moved to BackendSyncedComponents.tsx
// to align with backend tiers (FREE/PLUS/PRO).

// ============================================
// LIMIT REACHED MODAL
// ============================================

interface LimitReachedModalProps {
    type: 'poster'; // Only poster limits exist in backend
    currentUsage: number;
    limit: number;
    onUpgrade?: () => void;
    onClose?: () => void;
}

export function LimitReachedModal({ type, currentUsage, limit, onUpgrade, onClose }: LimitReachedModalProps) {
    const config = {
        poster: {
            title: 'Günlük Afiş Limitine Ulaştınız',
            description: 'Bugün için afiş üretim hakkınız bitti.',
            benefit: 'PLUS ile sınırsız afiş oluşturun',
            icon: '🎨',
        },
        // Listing limits removed per backend alignment rules
        // Request limits removed per backend alignment rules
    };

    const { title, description, benefit, icon } = config[type];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <div className="text-center">
                    <span className="text-5xl mb-4 block">{icon}</span>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
                    <p className="text-gray-600 mb-4">{description}</p>

                    {/* Usage Bar */}
                    <div className="bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                        {currentUsage}/{limit} kullanıldı
                    </p>

                    {/* Pro Benefit */}
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-center gap-2 text-purple-700 font-medium">
                            <Crown className="w-5 h-5" />
                            {benefit}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Daha Sonra
                        </button>
                        <button
                            onClick={onUpgrade}
                            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700"
                        >
                            Pro'ya Yükselt
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// VERIFIED ORGANIZER BADGE
// ============================================

interface VerifiedOrganizerBadgeProps {
    level: 'basic' | 'business' | 'premium';
    showLabel?: boolean;
}

export function VerifiedOrganizerBadge({ level, showLabel = true }: VerifiedOrganizerBadgeProps) {
    const config = {
        basic: {
            icon: <CheckCircle className="w-4 h-4" />,
            label: 'Doğrulanmış',
            className: 'text-blue-600',
        },
        business: {
            icon: (
                <div className="flex items-center">
                    <CheckCircle className="w-4 h-4" />
                    <CheckCircle className="w-4 h-4 -ml-1" />
                </div>
            ),
            label: 'Onaylı Acente',
            className: 'text-emerald-600',
        },
        premium: {
            icon: <Crown className="w-4 h-4" />,
            label: 'Premium Acente',
            className: 'text-purple-600',
        },
    };

    const { icon, label, className } = config[level];

    return (
        <div className={`inline-flex items-center gap-1 ${className}`}>
            {icon}
            {showLabel && <span className="text-sm font-medium">{label}</span>}
        </div>
    );
}

// ============================================
// SOCIAL PROOF BANNER
// ============================================

export function SocialProofBanner() {
    return (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 text-center">
            <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
                <span className="flex items-center gap-2">
                    <span className="font-bold">12,000+</span> organizatör
                </span>
                <span className="hidden sm:block">•</span>
                <span className="flex items-center gap-2">
                    <span className="font-bold">47</span> bu hafta Pro'ya geçti
                </span>
                <span className="hidden sm:block">•</span>
                <span className="flex items-center gap-2">
                    Pro organizatörler <span className="font-bold">3.5x</span> daha fazla talep alıyor
                </span>
            </div>
        </div>
    );
}
