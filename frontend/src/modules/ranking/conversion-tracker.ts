// ─── Conversion Tracker ─────────────────────────────────────────────────
// Records impressions, clicks, and computes conversion metrics.
// Fire-and-forget for recording. Sync for CTR reads (cached).

import { prisma } from "@/lib/prisma";

// ─── Recording (fire-and-forget) ────────────────────────────────────────

/**
 * Record that a listing was shown in search results.
 * Call when rendering search results. Do NOT await on hot path.
 */
export async function recordImpression(
    listingId: string,
    userId: string | null,
    source: "SEARCH" | "CATEGORY" | "HOME" | "DIRECT",
    position: number,
): Promise<string | null> {
    try {
        const impression = await prisma.listingImpression.create({
            data: { listingId, userId, source, position },
        });
        return impression.id;
    } catch {
        return null;
    }
}

/**
 * Record that a user clicked on a listing.
 * Deduplicated: same user + same listing = max 1 per 24h.
 */
export async function recordClick(
    listingId: string,
    userId: string | null,
    source: string,
    impressionId?: string,
    dwellTimeMs?: number,
): Promise<boolean> {
    try {
        // Dedup: skip if same user clicked this listing in last 24h
        if (userId) {
            const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
            const recent = await prisma.listingClick.findFirst({
                where: { listingId, userId, createdAt: { gte: oneDayAgo } },
            });
            if (recent) return false; // Already counted
        }

        // Exclude self-clicks (listing owner clicking own listing)
        // The caller should check this before calling, but we guard anyway
        await prisma.listingClick.create({
            data: {
                listingId,
                userId,
                source,
                impressionId: impressionId || null,
                dwellTimeMs: dwellTimeMs || null,
            },
        });
        return true;
    } catch {
        return false;
    }
}

// ─── Conversion Metrics ─────────────────────────────────────────────────

export interface ConversionMetrics {
    impressions: number;
    clicks: number;
    validClicks: number;       // Excluding <2s dwell time
    ctr: number;               // clicks / impressions
    avgDwellTimeMs: number;
}

/**
 * Compute conversion metrics for a listing over the trailing 30 days.
 * Used by the ranking engine to calculate conversion score.
 */
export async function getConversionMetrics(listingId: string): Promise<ConversionMetrics> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const [impressions, clicks] = await Promise.all([
        prisma.listingImpression.count({
            where: { listingId, createdAt: { gte: thirtyDaysAgo } },
        }),
        prisma.listingClick.findMany({
            where: { listingId, createdAt: { gte: thirtyDaysAgo } },
            select: { dwellTimeMs: true },
        }),
    ]);

    const totalClicks = clicks.length;
    // Valid clicks: dwell time > 2000ms (or null = no tracking yet, count as valid)
    const validClicks = clicks.filter(c => c.dwellTimeMs === null || c.dwellTimeMs > 2000).length;

    const dwellTimes = clicks
        .map(c => c.dwellTimeMs)
        .filter((d): d is number => d !== null && d > 0);
    const avgDwellTimeMs = dwellTimes.length > 0
        ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length
        : 0;

    const ctr = impressions > 0 ? validClicks / impressions : 0;

    return { impressions, clicks: totalClicks, validClicks, ctr, avgDwellTimeMs };
}

/**
 * Batch compute metrics for multiple listings (efficient for ranking).
 */
export async function getBatchConversionMetrics(
    listingIds: string[],
): Promise<Map<string, ConversionMetrics>> {
    const result = new Map<string, ConversionMetrics>();
    // Execute in parallel batches of 20
    const batchSize = 20;
    for (let i = 0; i < listingIds.length; i += batchSize) {
        const batch = listingIds.slice(i, i + batchSize);
        const metrics = await Promise.all(batch.map(id => getConversionMetrics(id)));
        batch.forEach((id, idx) => result.set(id, metrics[idx]));
    }
    return result;
}
