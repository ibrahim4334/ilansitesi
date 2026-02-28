// ─── pSEO JSON-LD Structured Data Utilities ───────────────────────────────
// Injects Schema.org structured data into Next.js pages to win rich snippets
// in Google search results (e.g., Star ratings, Prices, FAQs, Breadcrumbs).

import { RankingListingInput, RankingGuideInput } from "@/src/modules/ranking/ranking-engine";

export const PseoSchemaGenerator = {
    // 1. BreadcrumbList (Essential for deep generic navigation)
    generateBreadcrumbs(slug: string, h1Title: string) {
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Ana Sayfa",
                    "item": "https://umrebuldum.com"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Turlar",
                    "item": "https://umrebuldum.com/turlar"
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": h1Title,
                    "item": `https://umrebuldum.com/kategori/${slug}`
                }
            ]
        };
    },

    // 2. AggregateRating for Category Pages (e.g., "Mekke Turları")
    generateCategoryRating(reviewCount: number, averageRating: number) {
        if (reviewCount === 0) return null;
        return {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Umre Turları",
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": averageRating.toFixed(1),
                "reviewCount": reviewCount.toString(),
                "bestRating": "5",
                "worstRating": "1"
            }
        };
    },

    // 3. Product/Offer Schema for Individual Listings
    generateListingSchema(listing: RankingListingInput, guide: RankingGuideInput, title: string, reviewAvg: number) {
        return {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": title,
            "description": `${listing.city} çıkışlı, kimlik onaylı acentelerden.`,
            "offers": {
                "@type": "Offer",
                "url": `https://umrebuldum.com/ilan/${listing.id}`,
                "priceCurrency": "TRY",
                "price": listing.price.toString(),
                "availability": listing.filled < listing.quota ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
                "validFrom": listing.createdAt.toISOString().split('T')[0]
            },
            ...(guide.reviewCount > 0 ? {
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": reviewAvg.toFixed(1),
                    "reviewCount": guide.reviewCount.toString()
                }
            } : {})
        };
    },

    // 4. FAQ Schema for Long-Tail pages (e.g., "Ramazan Umresi Fiyatları")
    generateFaqSchema(pageType: "CITY" | "SEASON" | "ATTRIBUTE", targetKeyword: string) {
        let faqs = [];
        if (pageType === "CITY") {
            faqs = [
                {
                    q: `En iyi ${targetKeyword} hangileridir?`,
                    a: "Platformumuzda Trust (Güven) skoru yüksek, kimlik onaylı acentelerin sunduğu tüm güncel turları karşılaştırabilirsiniz."
                },
                {
                    q: `${targetKeyword} fiyatları ortalama ne kadar?`,
                    a: "Fiyatlar; kalınacak gün sayısı, otel mesafesi ve hava yoluna göre değişkenlik göstermekle birlikte ekonomik ve lüks (VIP) seçenekler mevcuttur."
                }
            ];
        } else if (pageType === "SEASON") {
            faqs = [
                {
                    q: `Kimlik onaylı ${targetKeyword} kayıtları ne zaman başlıyor?`,
                    a: "Özel acenteler kendi kontenjanlarını aylar öncesinden açarken, kuralar genellikle tur tarihinden 2-3 ay önce netleşmektedir."
                }
            ];
        } else {
            faqs = [
                {
                    q: `Güvenilir ${targetKeyword} nasıl bulunur?`,
                    a: "Puanı en az 4.5 olan ve platformumuzun risk doğrulamasından başarıyla geçmiş, kimlik doğrulaması yapılmış resmi firmaları tercih ediniz."
                }
            ];
        }

        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.q,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.a
                }
            }))
        };
    }
};
