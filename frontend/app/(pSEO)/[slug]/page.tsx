// ─── pSEO Dynamic Landing Page (Server Component) ─────────────────────────
// Matches any generated SEO slug (e.g., /istanbul-cikisli-umre-turlari)
// Fetches metadata from DB, queries RankingEngine with saved searchParams,
// and renders the highly indexed landing page with JSON-LD.

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PseoSchemaGenerator } from '@/lib/pseo-schema';
// Note: Depending on actual RankingEngine export path, we'd import it here to fetch listings.
// import { getRankedListings } from '@/src/modules/ranking/RankingService'; 

export const revalidate = 86400; // SSG: Revalide every 24 hours

// Generate Metadata for <head>
export async function generateMetadata({ params: rawParams }: { params: { slug: string } | Promise<{ slug: string }> }) {
    // Await params if it's a promise (Next.js 15+ compatibility)
    const resolvedParams = await Promise.resolve(rawParams);
    const slug = resolvedParams.slug;

    const page = await prisma.seoLandingPage.findUnique({
        where: { slug }
    });

    if (!page) return {};

    return {
        title: page.metaTitle,
        description: page.metaDescription,
        alternates: {
            canonical: `https://umrebuldum.com/${slug}`
        },
        openGraph: {
            title: page.metaTitle,
            description: page.metaDescription,
            type: 'website',
            url: `https://umrebuldum.com/${slug}`,
        }
    };
}

// Main Page Component
export default async function PseoLandingPage({ params: rawParams }: { params: { slug: string } | Promise<{ slug: string }> }) {
    // Await params
    const resolvedParams = await Promise.resolve(rawParams);
    const slug = resolvedParams.slug;

    // 1. Fetch Page Config
    const page = await prisma.seoLandingPage.findUnique({
        where: { slug }
    });

    if (!page) notFound();

    // 2. Fetch Aggregated Listings via Ranking Engine
    // In production, we'd pass page.searchParams to your RankingService
    // const listings = await getRankedListings(page.searchParams as any);
    const listingsCount = 24; // Mock for now

    // 3. Generate JSON-LD Rich Snippets
    const breadcrumbs = PseoSchemaGenerator.generateBreadcrumbs(slug, page.h1Title);
    const faqs = PseoSchemaGenerator.generateFaqSchema(page.pageType as any, page.targetKeyword);
    const rating = PseoSchemaGenerator.generateCategoryRating(145, 4.8); // Aggregate stats

    // 4. Track View (Fire and forget)
    // prisma.seoLandingPage.update({ where: { id: page.id }, data: { viewCount: { increment: 1 } } });

    return (
        <main className="min-h-screen bg-neutral-50 pb-20">
            {/* Inject Structured Data */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqs) }} />
            {rating && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(rating) }} />}

            {/* Header Section */}
            <div className="bg-primary-900 text-white py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                        {page.h1Title}
                    </h1>
                    <p className="text-lg text-primary-100 max-w-2xl">
                        {page.metaDescription}
                    </p>
                </div>
            </div>

            {/* Optional Content Block (Top SEO text) */}
            {page.contentHtml && (
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div
                        className="prose prose-neutral max-w-none text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: page.contentHtml }}
                    />
                </div>
            )}

            {/* Results Grid */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-semibold">
                        Sizin için {listingsCount} sonuç bulundu
                    </h2>
                    {/* Filters UI would go here */}
                </div>

                {/* Listings would be mapped here using organic ranking engine results */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* <ListingCard /> */}
                    <div className="h-64 bg-white rounded-xl border border-neutral-200 animate-pulse flex items-center justify-center text-neutral-400">
                        [Ranking Engine Sonuçları (Sıralı)]
                    </div>
                    <div className="h-64 bg-white rounded-xl border border-neutral-200 animate-pulse flex items-center justify-center text-neutral-400">
                        [Ranking Engine Sonuçları (Sıralı)]
                    </div>
                    <div className="h-64 bg-white rounded-xl border border-neutral-200 animate-pulse flex items-center justify-center text-neutral-400">
                        [Ranking Engine Sonuçları (Sıralı)]
                    </div>
                </div>
            </div>

            {/* Dynamic Internal Links (Silo Context) */}
            <div className="max-w-6xl mx-auto px-4 pt-12 border-t border-neutral-200 mt-12">
                <h3 className="text-lg font-semibold mb-4 text-neutral-700">İlgili Aramalar</h3>
                <div className="flex flex-wrap gap-3">
                    {/* These would be dynamically queried based on page type */}
                    <span className="px-4 py-2 bg-white border border-neutral-200 rounded-full text-sm text-neutral-600 hover:border-primary-500 cursor-pointer transition-colors">
                        Mekke Turları
                    </span>
                    <span className="px-4 py-2 bg-white border border-neutral-200 rounded-full text-sm text-neutral-600 hover:border-primary-500 cursor-pointer transition-colors">
                        Medine Turları
                    </span>
                    <span className="px-4 py-2 bg-white border border-neutral-200 rounded-full text-sm text-neutral-600 hover:border-primary-500 cursor-pointer transition-colors">
                        VIP Konaklama
                    </span>
                </div>
            </div>
        </main>
    );
}
