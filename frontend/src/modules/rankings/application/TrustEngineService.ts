import { atomicTrustDelta } from "../../fraud/application/atomic-trust";

export class TrustEngineService {
    /**
     * Delta-based penalty calculation for no-shows.
     * Delegates ALL trust mutations to atomicTrustDelta (CAS-atomic).
     *
     * @param userId Guide ID
     * @param completedBookings Total successful trips
     * @param noShows Number of no-shows
     */
    static async recalculateTrustScore(userId: string, completedBookings: number, noShows: number): Promise<number> {
        let delta = 0;

        if (completedBookings > 0) {
            const noShowRate = noShows / completedBookings;

            if (noShowRate >= 0.05 && noShowRate < 0.15) {
                delta = -5;   // Moderate penalty
            } else if (noShowRate >= 0.15) {
                delta = -15;  // Heavy penalty
            }
        } else if (noShows > 0) {
            delta = -20; // First trip no-show
        }

        if (delta === 0) {
            // No penalty needed — fetch and return current score
            const { prisma } = await import("@/lib/prisma");
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { trustScore: true },
            });
            return user?.trustScore ?? 50;
        }

        // Apply via CAS-atomic (no race condition possible)
        const result = await atomicTrustDelta(
            userId,
            delta,
            "NO_SHOW_PENALTY",
            { idempotencyKey: `noshow_${userId}_${completedBookings}_${noShows}` },
        );

        return result.current;
    }
}

