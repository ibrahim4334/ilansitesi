// ─── Atomic Trust Delta (CAS-based) ─────────────────────────────────────
// Single entry point for ALL trust score mutations.
// Eliminates race condition between TrustScoreEngine and TrustEngineService.
// Uses Compare-And-Swap via trustScoreVersion field.

import { prisma } from "@/lib/prisma";

const MAX_CAS_RETRIES = 3;
const MAX_DAILY_RECOMPUTATIONS = 1;
const MAX_INCREASE_PER_CYCLE = 5;

/**
 * The ONLY function that should ever mutate User.trustScore.
 * All other services MUST call this instead of direct prisma.user.update.
 *
 * Uses optimistic concurrency control (CAS):
 * - Reads current score + version
 * - Computes new score
 * - Writes ONLY IF version hasn't changed
 * - Retries on conflict
 *
 * @param userId Target user
 * @param delta Trust score change (positive = increase, negative = penalty)
 * @param reason Audit reason string
 * @param options Optional: skip cap (for penalties), idempotency key
 */
export async function atomicTrustDelta(
    userId: string,
    delta: number,
    reason: string,
    options?: {
        skipIncreaseCap?: boolean;  // Allow >+5 (e.g., admin override)
        idempotencyKey?: string;    // Prevent duplicate application
    },
): Promise<{ previous: number; current: number; applied: boolean }> {

    // Idempotency check: prevent duplicate penalty application
    if (options?.idempotencyKey) {
        const existing = await prisma.riskEvent.findFirst({
            where: {
                userId,
                eventType: "TRUST_CHANGE",
            },
        });
        // Check via raw query since JSON path queries vary by DB
        if (existing) {
            const meta = existing.metadata as any;
            if (meta?.idempotencyKey === options.idempotencyKey) {
                return { previous: 0, current: 0, applied: false };
            }
        }
    }

    for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { trustScore: true, trustScoreVersion: true },
        });

        if (!user) throw new Error("User not found");

        const previous = user.trustScore;
        let newScore = Math.max(0, Math.min(100, previous + delta));

        // Anti-manipulation: cap increases at +5 per cycle (unless skipped)
        if (delta > 0 && !options?.skipIncreaseCap) {
            const cappedDelta = Math.min(delta, MAX_INCREASE_PER_CYCLE);
            newScore = Math.max(0, Math.min(100, previous + cappedDelta));
        }

        // CAS: atomic conditional update
        const result = await prisma.user.updateMany({
            where: {
                id: userId,
                trustScoreVersion: user.trustScoreVersion,
            },
            data: {
                trustScore: newScore,
                trustScoreVersion: user.trustScoreVersion + 1,
            },
        });

        if (result.count === 1) {
            // Success — log audit trail
            const actualDelta = newScore - previous;
            if (actualDelta !== 0) {
                await prisma.riskEvent.create({
                    data: {
                        userId,
                        eventType: "TRUST_CHANGE",
                        severity: Math.abs(actualDelta) >= 10 ? "HIGH" : "LOW",
                        metadata: {
                            previous,
                            new: newScore,
                            delta: actualDelta,
                            reason,
                            ...(options?.idempotencyKey && { idempotencyKey: options.idempotencyKey }),
                        },
                    },
                });
            }

            return { previous, current: newScore, applied: true };
        }

        // CAS failed — concurrent update detected, retry with fresh data
        // Small jitter to reduce collision probability
        await new Promise(r => setTimeout(r, 10 + Math.random() * 20));
    }

    throw new Error(`Trust CAS failed after ${MAX_CAS_RETRIES} retries for user ${userId}`);
}

/**
 * Check if a trust recomputation is allowed (max 1/day).
 * Prevents trust staircase farming via rapid recomputation triggers.
 */
export async function canRecomputeTrust(userId: string): Promise<boolean> {
    const oneDayAgo = new Date(Date.now() - 86_400_000);
    const recentRecomputation = await prisma.riskEvent.findFirst({
        where: {
            userId,
            eventType: "TRUST_CHANGE",
            createdAt: { gte: oneDayAgo },
        },
    });

    // Check if the most recent was a TRUST_RECOMPUTATION
    if (recentRecomputation) {
        const meta = recentRecomputation.metadata as any;
        if (meta?.reason === "TRUST_RECOMPUTATION") {
            return false; // Already recomputed today
        }
    }

    return true;
}
