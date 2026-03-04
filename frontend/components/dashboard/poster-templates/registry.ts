import { TierType } from "@/lib/tier-config";

export interface TemplateConfig {
    id: string;
    name: string;
    description: string;
    requiredTier: "FREE" | "STARTER" | "PRO" | "LEGEND" | "CORP_BASIC" | "CORP_PRO" | "CORP_ENTERPRISE";
    thumbnail: string;
    // We can also require specific features like 'watermark: false' or 'posterQuality: "HIGH"'
    minQuality: "LOW" | "NORMAL" | "HIGH";
}

export const POSTER_TEMPLATES: TemplateConfig[] = [
    {
        id: "tpl-01-classic",
        name: "Klasik Umre",
        description: "Standart, temiz ve her pakete uygun tasarım.",
        requiredTier: "FREE",
        minQuality: "LOW",
        thumbnail: "/templates/tpl-01.jpg",
    },
    {
        id: "tpl-02-modern",
        name: "Modern Minimal",
        description: "Daha ferah ve modern görünüm.",
        requiredTier: "FREE",
        minQuality: "LOW",
        thumbnail: "/templates/tpl-02.jpg",
    },
    {
        id: "tpl-03-elegant",
        name: "Zarif Kabe",
        description: "Karanlık tema ve altın rengi detaylar.",
        requiredTier: "STARTER",
        minQuality: "NORMAL",
        thumbnail: "/templates/tpl-03.jpg",
    },
    {
        id: "tpl-04-premium",
        name: "Premium VIP",
        description: "Yüksek kaliteli kurumsal VIP tasarım.",
        requiredTier: "PRO",
        minQuality: "HIGH",
        thumbnail: "/templates/tpl-04.jpg",
    },
    {
        id: "tpl-05-luxury",
        name: "Lüks Medine",
        description: "Legend paketine özel beyaz ve altın lüks tasarım.",
        requiredTier: "LEGEND",
        minQuality: "HIGH",
        thumbnail: "/templates/tpl-05.jpg",
    },
    {
        id: "tpl-06-emerald",
        name: "Zümrüt Yeşil",
        description: "Canlı ve modern zümrüt yeşili kurumsal tasarım.",
        requiredTier: "PRO",
        minQuality: "HIGH",
        thumbnail: "/templates/tpl-06.jpg",
    },
    {
        id: "tpl-07-rose",
        name: "Huzur Gülü",
        description: "Aydınlık, ferah ve modern pembe tonlu minimal şablon.",
        requiredTier: "STARTER",
        minQuality: "NORMAL",
        thumbnail: "/templates/tpl-07.jpg",
    },
    {
        id: "tpl-08-indigo",
        name: "Gece İndigosu",
        description: "Gece mavisi arka plan ve vip görünümü.",
        requiredTier: "PRO",
        minQuality: "NORMAL",
        thumbnail: "/templates/tpl-08.jpg",
    },
    {
        id: "tpl-09-vibrant",
        name: "Enerjik Turuncu",
        description: "Canlı turuncu tonlarıyla dinamik tur şablonu",
        requiredTier: "PRO",
        minQuality: "HIGH",
        thumbnail: "/templates/tpl-09.jpg",
    },
    {
        id: "tpl-10-darkmatic",
        name: "Karanlık Minimal",
        description: "Enfes gece şablonu; modern, ultra-minimalist",
        requiredTier: "LEGEND",
        minQuality: "HIGH",
        thumbnail: "/templates/tpl-10.jpg",
    }
];
