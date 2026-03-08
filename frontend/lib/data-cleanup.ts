import { prisma } from "@/lib/prisma";

/**
 * Data retention cleanup — shared logic used by both:
 *   - /api/cron/cleanup (HTTP endpoint)
 *   - cron-runner.ts (node-cron schedule)
 *
 * Retention policy:
 *   - ListingImpression: 30 days
 *   - ListingClick: 30 days
 *   - VelocityCounter: 7 days
 */
export async function runDataCleanup() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [impressions, clicks, velocityCounters] = await Promise.all([
        prisma.listingImpression.deleteMany({
            where: { createdAt: { lt: thirtyDaysAgo } },
        }),
        prisma.listingClick.deleteMany({
            where: { createdAt: { lt: thirtyDaysAgo } },
        }),
        prisma.velocityCounter.deleteMany({
            where: { createdAt: { lt: sevenDaysAgo } },
        }),
    ]);

    return {
        listingImpressions: impressions.count,
        listingClicks: clicks.count,
        velocityCounters: velocityCounters.count,
        executedAt: now.toISOString(),
    };
}
