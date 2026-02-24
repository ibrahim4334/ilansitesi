// ─── Token Repository ───────────────────────────────────────────────────
// Database operations for token transactions.
// Only this file touches the DB for token-related reads/writes.

import { prisma } from "@/lib/prisma";

export class TokenRepository {
    /**
     * Get authoritative balance via SUM (not cached field).
     */
    static async getBalance(userId: string): Promise<number> {
        const result = await prisma.tokenTransaction.aggregate({
            where: { userId },
            _sum: { amount: true },
        });
        return result._sum.amount ?? 0;
    }

    /**
     * Get cached balance from User model (fast, non-authoritative).
     */
    static async getCachedBalance(userId: string): Promise<number> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { tokenBalance: true },
        });
        return user?.tokenBalance ?? 0;
    }

    /**
     * Count today's transactions of a specific type.
     */
    static async countTodayActions(userId: string, type: string): Promise<number> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        return prisma.tokenTransaction.count({
            where: { userId, type, createdAt: { gte: startOfDay } },
        });
    }

    /**
     * Get recent transactions for a user (paginated).
     */
    static async getHistory(
        userId: string,
        page: number = 1,
        limit: number = 20,
    ) {
        return prisma.tokenTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    /**
     * Find users eligible for monthly token renewal.
     */
    static async findRenewalEligible() {
        return prisma.user.findMany({
            where: {
                packageType: { not: "FREE" },
                packageExpiry: { gt: new Date() },
                role: { notIn: ["BANNED", "ADMIN"] },
            },
            select: {
                id: true,
                packageType: true,
                tokenBalance: true,
            },
        });
    }
}
