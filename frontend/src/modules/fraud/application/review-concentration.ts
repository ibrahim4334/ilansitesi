// ─── Review Concentration Defense ───────────────────────────────────────
// Detects single-target reviewer networks (Sybil review farms).
// Lightweight: uses aggregation on existing reviews table, no graph DB.
//
// Key insight: Sybil accounts created to review one guide have
// concentration = 1.0. Legitimate reviewers review multiple guides.

import { prisma } from "@/lib/prisma";

// ─── Concentration Scoring ──────────────────────────────────────────────

export interface ConcentrationResult {
    guideId: string;
    totalReviewers: number;
    singleTargetCount: number;     // Reviewers who only reviewed THIS guide
    concentrationRatio: number;     // singleTargetCount / totalReviewers
    penalty: number;               // 0.0 – 0.60 ranking quality penalty
    flagged: boolean;
}

/**
 * Compute reviewer concentration for a guide.
 * Detects when a disproportionate number of reviewers are "single-purpose"
 * accounts that exist only to review this one guide.
 *
 * Run as daily batch job (not real-time).
 * Runtime: ~5ms per guide (indexed queries).
 */
export async function computeReviewerConcentration(
    guideId: string,
): Promise<ConcentrationResult> {
    // Get distinct reviewers for this guide
    const reviewers = await prisma.review.findMany({
        where: { guideId, status: "APPROVED" },
        select: { reviewerUserId: true },
        distinct: ["reviewerUserId"],
    });

    const totalReviewers = reviewers.length;

    // Guard: small guides are exempt
    if (totalReviewers < 5) {
        return {
            guideId,
            totalReviewers,
            singleTargetCount: 0,
            concentrationRatio: 0,
            penalty: 0,
            flagged: false,
        };
    }

    // For each reviewer: check if they've reviewed ANY other guide
    let singleTargetCount = 0;

    // Batch query: get all reviewer IDs that have reviewed at least 1 other guide
    const reviewersWithOtherGuides = await prisma.review.groupBy({
        by: ["reviewerUserId"],
        where: {
            reviewerUserId: { in: reviewers.map(r => r.reviewerUserId) },
            guideId: { not: guideId },
            status: "APPROVED",
        },
    });

    const multiGuideReviewers = new Set(
        reviewersWithOtherGuides.map(r => r.reviewerUserId)
    );

    singleTargetCount = reviewers.filter(
        r => !multiGuideReviewers.has(r.reviewerUserId)
    ).length;

    const concentrationRatio = singleTargetCount / totalReviewers;

    // Compute penalty
    let penalty = 0;
    if (concentrationRatio > 0.7) penalty = 0.60;
    else if (concentrationRatio > 0.5) penalty = 0.35;
    else if (concentrationRatio > 0.3) penalty = 0.15;

    const flagged = concentrationRatio > 0.5 && singleTargetCount > 10;

    // Log alert if flagged
    if (flagged) {
        await prisma.riskEvent.create({
            data: {
                userId: guideId,
                eventType: "REVIEW_CONCENTRATION_ALERT",
                severity: concentrationRatio > 0.7 ? "HIGH" : "MEDIUM",
                metadata: {
                    totalReviewers,
                    singleTargetCount,
                    concentrationRatio: Math.round(concentrationRatio * 100) / 100,
                    penalty,
                },
            },
        });
    }

    return {
        guideId,
        totalReviewers,
        singleTargetCount,
        concentrationRatio,
        penalty,
        flagged,
    };
}

// ─── Review Weight Decay ────────────────────────────────────────────────

/**
 * Compute the weight of a review based on reviewer credibility.
 * Single-target new accounts get only 20% weight.
 * Used by ranking engine when computing quality score.
 */
export async function computeReviewWeight(
    reviewerUserId: string,
    guideId: string,
): Promise<number> {
    // How many OTHER guides has this reviewer reviewed?
    const otherGuideCount = await prisma.review.groupBy({
        by: ["guideId"],
        where: {
            reviewerUserId,
            guideId: { not: guideId },
            status: "APPROVED",
        },
    });

    const reviewer = await prisma.user.findUnique({
        where: { id: reviewerUserId },
        select: { createdAt: true },
    });

    const accountAgeDays = reviewer
        ? (Date.now() - reviewer.createdAt.getTime()) / 86_400_000
        : 0;

    // Single-target + new account → 20% weight
    if (otherGuideCount.length === 0 && accountAgeDays < 60) {
        return 0.2;
    }

    // Single-target + established account → 50% weight (loyal customer)
    if (otherGuideCount.length === 0) {
        return 0.5;
    }

    // Multi-guide reviewer → full weight
    return 1.0;
}

// ─── Batch Job: All Guides ──────────────────────────────────────────────

/**
 * Run concentration analysis for all guides with >10 reviews.
 * Designed to run as a daily background job.
 *
 * Performance at 10K guides: ~30 seconds
 * (500K queries with indexed reviewerUserId)
 */
export async function batchConcentrationAnalysis(): Promise<{
    analyzed: number;
    flagged: number;
}> {
    // Find guides with enough reviews to analyze
    const guidesWithReviews = await prisma.review.groupBy({
        by: ["guideId"],
        where: { status: "APPROVED" },
        _count: { id: true },
        having: { id: { _count: { gte: 5 } } },
    });

    let analyzed = 0;
    let flagged = 0;

    for (const guide of guidesWithReviews) {
        const result = await computeReviewerConcentration(guide.guideId);
        analyzed++;
        if (result.flagged) flagged++;
    }

    return { analyzed, flagged };
}
