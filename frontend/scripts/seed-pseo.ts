// ─── pSEO Route Generator Seed Script ─────────────────────────────────────
// Generates the foundational programmatic SEO landing pages in the database.
// These entries pre-populate the 'seo_landing_pages' table which the Next.js
// dynamic route handlers will read to generate SSR/SSG pages and metatags.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Configuration Data ──────────────────────────────────────────────────

const TOP_DEPARTURE_CITIES = [
    "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya",
    "Konya", "Kayseri", "Gaziantep", "Adana", "Trabzon",
    "Diyarbakır", "Erzurum", "Samsun", "Eskişehir", "Şanlıurfa"
];

const SEASONS = [
    { name: "Ramazan", year: "2026", keyword: "ramazan-umresi" },
    { name: "Şevval Ayı", year: "2026", keyword: "sevval-ayi-umresi" },
    { name: "Sömestr", year: "2026", keyword: "somestr-umre-turlari" },
    { name: "Kandil", year: "", keyword: "kandil-umre-turlari" },
    { name: "Yaz Tatili", year: "2026", keyword: "yaz-tatili-umre" }
];

const ATTRIBUTES = [
    { slug: "kimlik-onayli", name: "Kimlik Onaylı", key: "isIdentityVerified", val: true },
    { slug: "vip", name: "Lüks VIP", key: "priceMin", val: 25000 },
    { slug: "ekonomik", name: "Ekonomik", key: "priceMax", val: 15000 },
    { slug: "15-gunluk", name: "15 Günlük", key: "duration", val: 15 },
    { slug: "rehberli", name: "Özel Rehberli", key: "hasGuide", val: true }
];

// ── Data Generation Logic ───────────────────────────────────────────────

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

async function main() {
    console.log("🌱 Starting pSEO Data Seed...");

    // Clear existing to prevent duplicates during testing
    await prisma.seoLandingPage.deleteMany({});

    const pagesToCreate = [];

    // 1. Generate City Pages
    for (const city of TOP_DEPARTURE_CITIES) {
        pagesToCreate.push({
            slug: `${slugify(city)}-cikisli-umre-turlari`,
            pageType: "CITY",
            targetKeyword: `${city} çıkışlı umre turları`,
            h1Title: `${city} Çıkışlı En İyi Umre Turları`,
            metaTitle: `${city} Çıkışlı Umre Turları ve Fiyatları (2026) | UmreBuldum`,
            metaDescription: `${city} havalimanı çıkışlı, en uygun fiyatlı ve kimlik onaylı Umre turlarını karşılaştırın. Güvenilir acentelerden hemen teklif alın.`,
            searchParams: { city: city },
            contentHtml: `<h3>${city} Merkezli Umre Acenteleri</h3><p>${city} bölgesinden direkt veya aktarmalı uçuşlarla kutsal topraklara yapacağınız yolculuk için en güvenilir firmaları listeledik.</p>`,
        });
    }

    // 2. Generate Seasonal Pages
    for (const season of SEASONS) {
        const yearSuffix = season.year ? ` ${season.year}` : "";
        pagesToCreate.push({
            slug: season.keyword,
            pageType: "SEASON",
            targetKeyword: `${season.name} umresi${yearSuffix}`,
            h1Title: `${season.name} Umre Turları ve Fiyatları${yearSuffix}`,
            metaTitle: `${season.name} Umre Turları${yearSuffix} | Fiyatları Karşılaştır`,
            metaDescription: `Bereketli ${season.name} döneminde Umre ziyareti yapmak isteyenler için en iyi acentelerin sunduğu kontratlı fiyatlar ve paket detayları.`,
            searchParams: { season: season.name },
            contentHtml: null,
        });
    }

    // 3. Generate Attribute Pages
    for (const attr of ATTRIBUTES) {
        pagesToCreate.push({
            slug: `${attr.slug}-umre-sirketleri`,
            pageType: "ATTRIBUTE",
            targetKeyword: `${attr.name.toLowerCase()} umre turları`,
            h1Title: `${attr.name} Umre Turları ve Şirketleri`,
            metaTitle: `${attr.name} Puanı Yüksek Umre Turları | UmreBuldum`,
            metaDescription: `${attr.name} özelliklerine sahip onaylı Umre acentelerini, önceki ziyaretçilerin yorumlarıyla birlikte inceleyin ve güvenle karar verin.`,
            searchParams: { [attr.key]: attr.val },
            contentHtml: `<p>Manevi iklimi doya doya yaşamak için <strong>${attr.name.toLowerCase()}</strong> seçenekleri arayan yolcularımızın en çok tercih ettiği onaylı programlar.</p>`,
        });
    }

    // Bulk Insert
    console.log(`Inserting ${pagesToCreate.length} SEO routes...`);
    const result = await prisma.seoLandingPage.createMany({
        data: pagesToCreate,
        skipDuplicates: true,
    });

    console.log(`✅ Successfully seeded ${result.count} pSEO landing pages.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
