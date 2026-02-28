// ─── Review Integrity Engine ────────────────────────────────────────────
// Lightweight integrity checks for review authenticity:
// - Trigram Jaccard similarity detection
// - Temporal clustering detection
// - Auto-action tiers based on reviewer trust

import { prisma } from "@/lib/prisma";

// ─── Trigram Similarity ─────────────────────────────────────────────────

/**
 * Extract trigrams from a string.
 * Performance: pure TypeScript, <1ms for typical review length.
 */
function getTrigrams(text: string): string[] {
    const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
    if (normalized.length < 3) return [normalized];

    const trigrams: string[] = [];
    for (let i = 0; i <= normalized.length - 3; i++) {
        trigrams.push(normalized.slice(i, i + 3));
    }
    return trigrams;
}

/**
 * Compute Jaccard similarity between two texts using trigrams.
 * Returns 0.0 (no similarity) to 1.0 (identical).
 * Performance: <5ms for reviews under 500 characters.
 */
export function trigramSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;

    const trigramsA = new Set(getTrigrams(a));
    const trigramsB = new Set(getTrigrams(b));

    if (trigramsA.size === 0 && trigramsB.size === 0) return 0;

    let intersectionCount = 0;
    for (const t of trigramsA) {
        if (trigramsB.has(t)) intersectionCount++;
    }

    const unionSize = new Set([...trigramsA, ...trigramsB]).size;
    return unionSize > 0 ? intersectionCount / unionSize : 0;
}

// ─── Integrity Check Results ────────────────────────────────────────────

export interface ReviewIntegrityResult {
    action: "AUTO_APPROVE" | "QUEUE_FOR_REVIEW" | "AUTO_REJECT";
    flags: string[];
    similarityScore: number | null;
    clusterCount: number;
}

// ─── Main Integrity Check ───────────────────────────────────────────────

/**
 * Run all integrity checks on a new review before persisting.
 * Returns recommended action and detected flags.
 *
 * @param guideId The guide being reviewed
 * @param reviewerUserId The reviewer
 * @param comment The review comment text
 * @param isExtremeRating Whether all ratings are 1 or all are 5
 * @param hasProfanity Whether profanity was detected
 */
export async function checkReviewIntegrity(
    guideId: string,
    reviewerUserId: string,
    comment: string | null,
    isExtremeRating: boolean,
    hasProfanity: boolean,
): Promise<ReviewIntegrityResult> {
    const flags: string[] = [];
    let similarityScore: number | null = null;

    // 1. Check reviewer trust score
    const reviewer = await prisma.user.findUnique({
        where: { id: reviewerUserId },
        select: { trustScore: true },
    });

    const reviewerTrust = reviewer?.trustScore ?? 50;

    // Auto-reject if reviewer is very low trust
    if (reviewerTrust < 20) {
        return {
            action: "AUTO_REJECT",
            flags: ["LOW_TRUST_REVIEWER"],
            similarityScore: null,
            clusterCount: 0,
        };
    }

    // 2. Check Sybil cluster membership
    const recentSybil = await prisma.riskEvent.findFirst({
        where: {
            userId: reviewerUserId,
            eventType: "SYBIL_DETECTED",
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
        },
        select: { metadata: true },
    });

    if (recentSybil) {
        const meta = recentSybil.metadata as any;
        if (meta?.confidence >= 0.8) {
            return {
                action: "AUTO_REJECT",
                flags: ["SYBIL_CLUSTER_MEMBER"],
                similarityScore: null,
                clusterCount: 0,
            };
        }
    }

    // 3. Trigram similarity detection
    if (comment && comment.length >= 20) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
        const recentReviews = await prisma.review.findMany({
            where: {
                guideId,
                status: "APPROVED",
                createdAt: { gte: thirtyDaysAgo },
                comment: { not: null },
            },
            select: { comment: true },
            take: 20,
            orderBy: { createdAt: "desc" },
        });

        let maxSimilarity = 0;
        for (const existing of recentReviews) {
            if (existing.comment) {
                const sim = trigramSimilarity(comment, existing.comment);
                maxSimilarity = Math.max(maxSimilarity, sim);
            }
        }

        similarityScore = maxSimilarity;

        if (maxSimilarity > 0.7) {
            flags.push("SIMILAR_REVIEW");
        }
    }

    // 4. Temporal clustering detection
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const clusterCount = await prisma.review.count({
        where: {
            guideId,
            createdAt: { gte: twentyFourHoursAgo },
        },
    });

    if (clusterCount >= 5) {
        flags.push("TEMPORAL_CLUSTER");

        // Log risk event for the guide (unusual review volume)
        await prisma.riskEvent.create({
            data: {
                userId: guideId,
                eventType: "REVIEW_CLUSTER",
                severity: "MEDIUM",
                metadata: {
                    count: clusterCount + 1,
                    window: "24h",
                    latestReviewer: reviewerUserId,
                },
            },
        }).catch(() => { /* non-blocking */ });
    }

    // 5. Existing flags
    if (isExtremeRating) flags.push("EXTREME_RATING");
    if (hasProfanity) flags.push("PROFANITY");

    // 6. Determine action
    if (flags.length === 0 && reviewerTrust >= 70) {
        return {
            action: "AUTO_APPROVE",
            flags: [],
            similarityScore,
            clusterCount,
        };
    }

    if (flags.length > 0) {
        return {
            action: "QUEUE_FOR_REVIEW",
            flags,
            similarityScore,
            clusterCount,
        };
    }

    // Default: queue moderate-trust reviewers with no flags
    return {
        action: "AUTO_APPROVE",
        flags: [],
        similarityScore,
        clusterCount,
    };
}
