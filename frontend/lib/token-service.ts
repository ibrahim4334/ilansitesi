import { prisma } from "./prisma";

// ─── Credit Economy Constants ───────────────────────────────────────────

export class TokenService {
    // Interest costs
    static readonly COST_GUIDE_INTEREST = 5;
    static readonly COST_ORG_INTEREST = 10;

    // Feature cost
    static readonly COST_FEATURE = 10;

    // Feature cap
    static readonly MAX_FEATURED_LISTINGS = 3;

    /**
     * Get REAL balance from CreditTransaction ledger (source of truth).
     * GuideProfile.credits is only a cache for quick reads.
     */
    static async getBalance(userId: string): Promise<number> {
        const result = await prisma.creditTransaction.aggregate({
            where: { userId },
            _sum: { amount: true }
        });
        return result._sum.amount || 0;
    }

    /**
     * Deduct credits atomically:
     * Balance check AND deduction happen inside the SAME $transaction.
     * Uses ledger SUM (source of truth), NOT cache.
     */
    static async deductCredits(
        userId: string,
        cost: number,
        reason: string,
        relatedId?: string
    ): Promise<{ success: boolean; newBalance: number }> {
        try {
            const result = await prisma.$transaction(async (tx) => {
                // 1. Check balance from ledger INSIDE transaction
                const balanceResult = await tx.creditTransaction.aggregate({
                    where: { userId },
                    _sum: { amount: true }
                });
                const currentBalance = balanceResult._sum.amount || 0;

                if (currentBalance < cost) {
                    throw new Error('INSUFFICIENT_CREDITS');
                }

                // 2. Write to ledger (source of truth)
                await tx.creditTransaction.create({
                    data: {
                        userId,
                        amount: -cost,
                        type: "spend",
                        reason,
                        relatedId: relatedId || null,
                    }
                });

                // 3. Update cache on GuideProfile
                const updatedProfile = await tx.guideProfile.update({
                    where: { userId },
                    data: { credits: { decrement: cost } }
                });

                return updatedProfile.credits;
            });

            console.log(`[CreditService] Deducted ${cost} from ${userId}: ${reason}. New balance: ${result}`);
            return { success: true, newBalance: result };
        } catch (error: any) {
            if (error.message === 'INSUFFICIENT_CREDITS') {
                const balance = await this.getBalance(userId);
                return { success: false, newBalance: balance };
            }
            throw error;
        }
    }

    /**
     * Grant credits atomically:
     * 1. Insert CreditTransaction (positive amount)
     * 2. Increment GuideProfile.credits (cache)
     */
    static async grantCredits(
        userId: string,
        amount: number,
        type: "purchase" | "refund" | "admin",
        reason: string,
        relatedId?: string
    ): Promise<number> {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Write to ledger
            await tx.creditTransaction.create({
                data: {
                    userId,
                    amount, // positive
                    type,
                    reason,
                    relatedId: relatedId || null,
                }
            });

            // 2. Update cache
            const updatedProfile = await tx.guideProfile.upsert({
                where: { userId },
                update: { credits: { increment: amount } },
                create: {
                    userId,
                    fullName: "Unknown Guide",
                    phone: "",
                    city: "",
                    credits: amount,
                    package: "FREEMIUM",
                    tokens: 0
                }
            });

            return updatedProfile.credits;
        });

        console.log(`[CreditService] Granted ${amount} to ${userId} (${type}): ${reason}. New balance: ${result}`);
        return result;
    }

    /**
     * Sync cache: recompute GuideProfile.credits from CreditTransaction ledger.
     * Use this if cache gets out of sync.
     */
    static async syncBalance(userId: string): Promise<number> {
        const realBalance = await this.getBalance(userId);

        await prisma.guideProfile.update({
            where: { userId },
            data: { credits: realBalance }
        });

        return realBalance;
    }
}
