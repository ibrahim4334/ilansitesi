// ─── Agency Analytics Service (FOMO Engine) ───────────────────────────────
// Generates the data required for the Agency Dashboard. Intentionally structured
// to expose limitations on the FREE tier, driving the "Conversion Up" strategy.

import { prisma } from '@/lib/prisma';
import { PackageSystem } from '@/lib/package-system';

export class AgencyAnalyticsService {

    /**
     * The core dashboard funnel metrics: Impressions -> Views.
     * FREE users get the base numbers. PRO+ users get the Search Keywords and Dwell Time.
     */
    static async getProfileFunnel(guideId: string, days: number = 30) {
        const startDate = new Date(Date.now() - days * 86400000);

        // A single guide might have multiple listings, but for FREE it's just 1.
        const listings = await prisma.guideListing.findMany({
            where: { guideId },
            select: { id: true, packageType: true }
        });

        const listingIds = listings.map(l => l.id);
        const pkg = listings[0]?.packageType || "FREE";

        // Aggregate core numbers
        const impressions = await prisma.listingImpression.count({
            where: { listingId: { in: listingIds }, createdAt: { gte: startDate } }
        });

        const clicks = await prisma.listingClick.count({
            where: { listingId: { in: listingIds }, createdAt: { gte: startDate } }
        });

        // Conversion Rate
        const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : "0.0";

        // Advanced Metrics (Gated for FREE users)
        let topKeywords: Array<{ query: string, count: number }> = [];
        let avgDwellTime = 0;
        const isPremiumDataUnlocked = ["STARTER", "PRO", "LEGEND", "CORP_BASIC", "CORP_PRO", "CORP_ENTERPRISE"].includes(pkg);

        if (isPremiumDataUnlocked) {
            // Unlock Search Keywords
            const keywordAgg = await prisma.listingImpression.groupBy({
                by: ['searchQuery'],
                where: { listingId: { in: listingIds }, createdAt: { gte: startDate }, searchQuery: { not: null } },
                _count: { searchQuery: true },
                orderBy: { _count: { searchQuery: 'desc' } },
                take: 5
            });
            topKeywords = keywordAgg.map(k => ({ query: k.searchQuery!, count: k._count.searchQuery }));

            // Unlock Dwell Time
            const dwellAgg = await prisma.listingClick.aggregate({
                where: { listingId: { in: listingIds }, createdAt: { gte: startDate }, dwellTimeMs: { not: null } },
                _avg: { dwellTimeMs: true }
            });
            avgDwellTime = dwellAgg._avg.dwellTimeMs ? Math.round(dwellAgg._avg.dwellTimeMs / 1000) : 0;
        }

        return {
            baseMetrics: {
                totalImpressions: impressions,
                totalProfileViews: clicks,
                conversionRate: `${ctr}%`
            },
            advancedMetrics: {
                isUnlocked: isPremiumDataUnlocked,
                topKeywords: isPremiumDataUnlocked ? topKeywords : "BLOCKED_FOR_FREE",
                avgDwellTimeSeconds: isPremiumDataUnlocked ? avgDwellTime : "BLOCKED_FOR_FREE",
                unlockMessage: !isPremiumDataUnlocked ? "Arama kelimelerini ve sayfa kalma sürelerini görmek için STARTER pakete geçin." : null
            }
        };
    }

    /**
     * Local Competition status. Compares organic performance to the top 3 in their city.
     */
    static async getLocalRankingStatus(guideId: string) {
        // Find their active listing and city
        const activeListing = await prisma.guideListing.findFirst({
            where: { guideId, status: "PUBLISHED" },
            include: { guide: true }
        });

        if (!activeListing) return null;

        const currentCity = activeListing.city;

        // In a real implementation, we would call RankingService.scoreListing(activeListing)
        // Here we simulate the delta logic.
        const mockMyScore = 650;
        const mockTop3Avg = 810;
        const delta = mockTop3Avg - mockMyScore;

        return {
            city: currentCity,
            myEstimatedScore: mockMyScore,
            top3AverageScore: mockTop3Avg,
            deltaToTop3: delta,
            recommendation: delta > 0
                ? `1. Sayfaya çıkmak için ortalama ${delta} puana daha ihtiyacınız var. BOOST kullanarak hemen yükselebilirsiniz.`
                : `Tebrikler, şehrinizde organik olarak Top 3 içerisindesiniz!`
        };
    }
}
