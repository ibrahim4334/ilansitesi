import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Turkish character replacement map for slug generation
const trMap: { [key: string]: string } = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u',
};

function slugify(text: string): string {
    return text
        .split('')
        .map(char => trMap[char] || char)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .trim()
        .replace(/\s+/g, '-');        // Replace spaces with hyphens
}

async function main() {
    console.log("Starting pSEO seeding...");

    // 1. Core Arrays
    const cities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Konya", "Kayseri"];
    const durations = ["7 Günlük", "14 Günlük", "15 Günlük", "20 Günlük", "28 Günlük"];
    const concepts = ["Ekonomik", "Lüks", "5 Yıldızlı", "Kabe Manzaralı", "Sömestr", "Ramazan"];

    const seoPages: any[] = [];
    const currentYear = new Date().getFullYear();

    // Strategy 1: City + Duration (e.g., "İstanbul Çıkışlı 15 Günlük Umre Turları")
    for (const city of cities) {
        for (const duration of durations) {
            const h1Title = `${city} Çıkışlı ${duration} Umre Turları`;
            const targetKeyword = `${city} ${duration} Umre`;
            const slug = slugify(h1Title);

            seoPages.push({
                slug,
                pageType: "CITY",
                targetKeyword,
                h1Title,
                metaTitle: `${h1Title} - En Uygun Fiyatlar ${currentYear}`,
                metaDescription: `${city} çıkışlı en popüler ${duration} umre rotalarını karşılaştırın. ${currentYear} dönemi için Diyanet onaylı, güvenilir acente turları %20'ye varan indirimlerle Umre Buldum'da!`,
                searchParams: { departureCityOld: city, durationText: duration },
                isIndexed: true,
            });
        }
    }

    // Strategy 2: Concept (e.g., "5 Yıldızlı Lüks Umre Turları 2026")
    for (const concept of concepts) {
        const h1Title = `${concept} Umre Turları ${currentYear}`;
        const targetKeyword = `${concept} Umre`;
        const slug = slugify(h1Title);

        seoPages.push({
            slug,
            pageType: "ATTRIBUTE",
            targetKeyword,
            h1Title,
            metaTitle: `${h1Title} | Fiyatları Karşılaştır`,
            metaDescription: `Aradığınız ${concept.toLowerCase()} konseptindeki umre turları burada. Kullanıcı yorumları, 5 yıldızlı oteller ve en uygun fiyat garantisiyle hemen rezervasyon yapın!`,
            searchParams: { concept: concept },
            isIndexed: true,
        });

        // Strategy 2.5: City + Concept (e.g., "Ankara Çıkışlı Lüks Umre Turları")
        for (const city of cities) {
            const comboTitle = `${city} Çıkışlı ${concept} Umre Turları`;
            const comboTarget = `${city} ${concept} Umre`;
            const comboSlug = slugify(comboTitle);

            seoPages.push({
                slug: comboSlug,
                pageType: "CITY",
                targetKeyword: comboTarget,
                h1Title: comboTitle,
                metaTitle: `${comboTitle} - ${currentYear} Fiyatları`,
                metaDescription: `${city} kalkışlı ${concept.toLowerCase()} umre turlarını inceleyin. Bütçenize en uygun ve güvenilir Diyanet onaylı seçenekler Umre Buldum'da!`,
                searchParams: { departureCityOld: city, concept: concept },
                isIndexed: true,
            });
        }
    }

    // Insert to DB using createMany (Skip duplicates safely)
    console.log(`Prepared ${seoPages.length} unique SEO Landing Page combinations.`);

    try {
        const result = await prisma.seoLandingPage.createMany({
            data: seoPages,
            skipDuplicates: true, // Crucial: Don't map over existing slugs
        });

        console.log(`Successfully seeded ${result.count} NEW SEO pages into the database! 🚀`);
    } catch (error) {
        console.error("Error seeding SEO pages:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
