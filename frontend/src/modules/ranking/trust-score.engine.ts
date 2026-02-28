import { prisma } from "@/lib/prisma";
import { atomicTrustDelta, canRecomputeTrust } from "../fraud/application/atomic-trust";

/**
 * Trust Score Calculation Engine (v3 — CAS-atomic, rate-limited)
 * 
 * Computes the ideal trust score, then applies the DELTA via atomicTrustDelta.
 * Max 1 recomputation per day per user (prevents staircase farming).
 * Max +5 increase per cycle (enforced by atomicTrustDelta).
 */
export class TrustScoreEngine {
    public static async calculateAndUpdateTrustScore(userId: string): Promise<number> {
        // Rate limit: max 1 recomputation per day
        const allowed = await canRecomputeTrust(userId);
        if (!allowed) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { trustScore: true },
            });
            return user?.trustScore ?? 50;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                reviewsReceived: {
                    where: { status: "APPROVED" },
                    select: { overallRating: true, comment: true }
                }
            }
        });

        if (!user) return 50;

        const previousScore = user.trustScore;
        let baseScore = 40;

        // 1. Review Quality Score (max 30)
        let reviewScore = 0;
        if (user.reviewsReceived.length > 0) {
            const avgRating = user.reviewsReceived.reduce((acc, rev) => acc + Number(rev.overallRating), 0) / user.reviewsReceived.length;
            const detailedReviews = user.reviewsReceived.filter(r => r.comment && r.comment.length >= 50).length;
            const detailRatio = detailedReviews / user.reviewsReceived.length;
            reviewScore = (avgRating * 5) + (detailRatio * 5);
        }

        // 2. Completed Trips Score (max 20)
        const tripsScore = Math.min(user.completedTrips * 2, 20);

        // 3. Account Age Score (max 10)
        const daysSinceCreation = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const ageScore = Math.min(daysSinceCreation / 30, 10);

        // 4. Verification Multiplier
        const multiplier = (user as any).isIdentityVerified ? 1.2 : 1.0;

        let computedScore = (baseScore + reviewScore + tripsScore + ageScore) * multiplier;

        // 5. Cancellation Penalty
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000);
        const cancellationRecords = await prisma.cancellationRecord.findMany({
            where: { userId, createdAt: { gte: ninetyDaysAgo } },
            select: { trustPenalty: true },
        });
        const cancellationPenalty = cancellationRecords.reduce((sum: number, r: { trustPenalty: number }) => sum + r.trustPenalty, 0);
        computedScore -= cancellationPenalty;

        // 6. Inactivity Decay
        const monthsSinceUpdate = (Date.now() - user.updatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsSinceUpdate > 1) {
            computedScore -= Math.floor(monthsSinceUpdate);
        }

        // Clamp to 0-100
        const idealScore = Math.max(0, Math.min(Math.round(computedScore), 100));

        // Compute delta from current score
        const delta = idealScore - previousScore;

        if (delta === 0) return previousScore;

        // Apply via CAS-atomic trust delta (+5 cap enforced inside)
        const result = await atomicTrustDelta(userId, delta, "TRUST_RECOMPUTATION");

        return result.current;
    }
}

