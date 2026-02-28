// ─── SLA Tracker ────────────────────────────────────────────────────────
// Event-driven service that computes actual response times.
// Replaces hardcoded avgResponseHours = 12 with real EMA-computed values.

import { prisma } from "@/lib/prisma";

// ─── Constants ──────────────────────────────────────────────────────────

const EMA_ALPHA = 0.3;  // Smoothing factor for Exponential Moving Average

// Soft and hard deadlines in milliseconds
const DEADLINES = {
    FIRST_RESPONSE: { softMs: 6 * 3600 * 1000, hardMs: 24 * 3600 * 1000 },
    OFFER_RESPONSE: { softMs: 12 * 3600 * 1000, hardMs: 48 * 3600 * 1000 },
    COMPLAINT_RESPONSE: { softMs: 24 * 3600 * 1000, hardMs: 72 * 3600 * 1000 },
} as const;

type MetricType = keyof typeof DEADLINES;

// ─── Response Time Recording ────────────────────────────────────────────

/**
 * Record a response time event and update the user's EMA-smoothed avgResponseHours.
 * Call when a guide sends a message in response to a user demand/message.
 *
 * @param userId Guide's user ID
 * @param metricType Type of response being measured
 * @param responseTimeMs Actual response time in milliseconds
 */
export async function recordResponseTime(
    userId: string,
    metricType: MetricType,
    responseTimeMs: number,
): Promise<{
    newAvgResponseHours: number;
    slaViolation: boolean;
    penaltyApplied: boolean;
}> {
    // 1. Store the raw metric
    await prisma.sLAMetric.create({
        data: {
            userId,
            metricType,
            valueMs: responseTimeMs,
        },
    });

    // 2. Update EMA-smoothed average on user
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { avgResponseHours: true, trustScore: true },
    });

    if (!user) throw new Error("User not found");

    const responseHours = responseTimeMs / 3_600_000;
    const previousAvg = user.avgResponseHours;
    const newAvg = EMA_ALPHA * responseHours + (1 - EMA_ALPHA) * previousAvg;

    await prisma.user.update({
        where: { id: userId },
        data: { avgResponseHours: Math.round(newAvg * 100) / 100 }, // 2 decimal places
    });

    // 3. Check SLA violation
    const deadline = DEADLINES[metricType];
    const isHardViolation = responseTimeMs > deadline.hardMs;
    let penaltyApplied = false;

    if (isHardViolation) {
        // Apply trust penalty
        const newTrust = Math.max(0, user.trustScore - 3);
        await prisma.user.update({
            where: { id: userId },
            data: { trustScore: newTrust },
        });

        // Log violation
        await prisma.riskEvent.create({
            data: {
                userId,
                eventType: "SLA_VIOLATION",
                severity: "MEDIUM",
                metadata: {
                    metricType,
                    responseTimeMs,
                    deadlineMs: deadline.hardMs,
                    trustDelta: -3,
                },
            },
        });

        penaltyApplied = true;
    }

    return {
        newAvgResponseHours: newAvg,
        slaViolation: isHardViolation,
        penaltyApplied,
    };
}

// ─── SLA Score Computation ──────────────────────────────────────────────

/**
 * Get the current SLA score (0–100) for a user based on recent metrics.
 * Used by ranking engine for response time scoring.
 */
export async function computeSLAScore(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const violations = await prisma.riskEvent.count({
        where: {
            userId,
            eventType: "SLA_VIOLATION",
            createdAt: { gte: thirtyDaysAgo },
        },
    });

    // Score decreases with violations: 100, 90, 75, 55, 30, 0
    if (violations === 0) return 100;
    if (violations <= 1) return 90;
    if (violations <= 2) return 75;
    if (violations <= 3) return 55;
    if (violations <= 5) return 30;
    return 0;
}

/**
 * Check if a user has chronic SLA violations requiring escalation.
 * Called by enforcement middleware or background job.
 */
export async function checkSLAEscalation(userId: string): Promise<{
    shouldDeprioritize: boolean;
    shouldGateFeatures: boolean;
    violationCount: number;
}> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const violationCount = await prisma.riskEvent.count({
        where: {
            userId,
            eventType: "SLA_VIOLATION",
            createdAt: { gte: thirtyDaysAgo },
        },
    });

    return {
        shouldDeprioritize: violationCount > 3,    // Ranking penalty −100
        shouldGateFeatures: violationCount > 5,    // Features gated until admin review
        violationCount,
    };
}
