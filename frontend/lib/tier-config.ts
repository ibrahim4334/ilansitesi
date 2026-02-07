/**
 * BACKEND TIER CONFIGURATION
 * 
 * Single Source of Truth: /wp-json/umrebuldum/v1/access
 * 
 * Logic is handled by Backend (Access_Control.php).
 * Frontend only presents data.
 */

export const TIERS = {
    FREE: 'free',
    PLUS: 'plus',
    PRO: 'pro',
} as const;

export type TierType = typeof TIERS[keyof typeof TIERS];

export interface AccessInfo {
    tier: TierType;
    tier_name: string;
    daily_limit: number | null;
    daily_used: number;
    can_generate: boolean;
    quality: 60 | 85 | 100;
    watermark: boolean;
    emergency: boolean;
    features: {
        high_quality: boolean;
        unlimited_exports: boolean;
        guide_info: boolean;
        qr_emergency: boolean;
        custom_branding: boolean;
        organization_logo: boolean;
        multiple_tours: boolean;
        youtube_embeds: boolean;
        analytics_hooks: boolean;
    };
}

export interface TierDisplayConfig {
    id: TierType;
    name: string;
    price: string;
    description: string;
    cta: string;
    features: string[];
    popular: boolean;
}

export const TIER_DISPLAY_CONFIG: Record<TierType, TierDisplayConfig> = {
    [TIERS.FREE]: {
        id: TIERS.FREE,
        name: 'Ücretsiz', // Backend'den gelen isim kullanılmalı ama fallback olarak burada
        price: '₺0',
        description: 'Başlangıç paketi',
        cta: 'Mevcut Plan',
        features: [
            'Günde 5 Poster',
            'Standart Kalite (%60)',
            'Watermark (Filigran)',
            'Temel Export'
        ],
        popular: false
    },
    [TIERS.PLUS]: {
        id: TIERS.PLUS,
        name: 'PLUS',
        price: '₺299/ay',
        description: 'Bireysel rehberler için',
        cta: 'PLUS\'a Yükselt',
        features: [
            'Sınırsız Poster',
            'Yüksek Kalite (%85)',
            'Watermark Yok 🚫',
            'Acil Durum Ekranı 🆘',
            'Rehber Bilgileri',
            'Karekod (QR)'
        ],
        popular: true
    },
    [TIERS.PRO]: {
        id: TIERS.PRO,
        name: 'PRO',
        price: '₺999/ay',
        description: 'Acenteler ve şirketler için',
        cta: 'PRO\'ya Yükselt',
        features: [
            'Sınırsız Poster',
            'Maksimum Kalite (%100)',
            'Watermark Yok 🚫',
            'Acil Durum Ekranı 🆘',
            'Kurumsal Logo & Branding',
            'YouTube Embed',
            'Analytics Entegrasyonu'
        ],
        popular: false
    }
};

/**
 * Fetch Access Info from Backend
 */
export async function fetchAccessInfo(): Promise<AccessInfo | null> {
    try {
        const res = await fetch('/wp-json/umrebuldum/v1/access');
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error('Failed to fetch access info', e);
        return null;
    }
}
