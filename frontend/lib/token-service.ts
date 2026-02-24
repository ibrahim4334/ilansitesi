import { prisma } from "./prisma";
import { withSerializableRetry } from "./with-retry";

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
     * Deduct credits atomically and idempotently.
     *
     * Safety guarantees:
     * 1. Idempotency: if `idempotencyKey` was already used, return success with no-op.
     * 2. Row-level lock: uses SELECT SUM ... FOR UPDATE to lock all rows for this userId,
     *    preventing concurrent transactions from reading stale balances.
     * 3. Strict non-negative balance: rejects if balance - cost < 0.
     * 4. All writes (ledger + cache) happen inside a single $transaction.
     */
    static async deductCredits(
        userId: string,
        cost: number,
        reason: string,
        relatedId?: string,
        idempotencyKey?: string
    ): Promise<{ success: boolean; newBalance: number; idempotent?: boolean }> {
        try {
            const result = await withSerializableRetry(() => prisma.$transaction(async (tx) => {
                // ── (1) Idempotency check: if key exists, return cached result ──
                if (idempotencyKey) {
                    const existing = await tx.creditTransaction.findUnique({
                        where: { idempotencyKey }
                    });
                    if (existing) {
                        // Already processed — compute current balance and return
                        const bal = await tx.creditTransaction.aggregate({
                            where: { userId },
                            _sum: { amount: true }
                        });
                        return { newBalance: bal._sum.amount || 0, idempotent: true };
                    }
                }

                // ── (2) Row-level lock via raw SQL (MySQL SELECT FOR UPDATE) ──
                // This prevents parallel transactions from reading the same pre-deduction balance.
                const [balanceRow] = await tx.$queryRaw<[{ balance: number }]>`
                    SELECT COALESCE(SUM(amount), 0) AS balance
                    FROM credit_transactions
                    WHERE userId = ${userId}
                    FOR UPDATE
                `;
                const currentBalance = Number(balanceRow.balance);

                // ── (3) Strict non-negative guard ──
                if (currentBalance - cost < 0) {
                    throw new Error('INSUFFICIENT_CREDITS');
                }

                // ── (4) Write to ledger ──
                await tx.creditTransaction.create({
                    data: {
                        userId,
                        amount: -cost,
                        type: "spend",
                        reason,
                        relatedId: relatedId || null,
                        idempotencyKey: idempotencyKey || null,
                    }
                });

                // ── (5) Update GuideProfile cache ──
                const updatedProfile = await tx.guideProfile.update({
                    where: { userId },
                    data: { credits: { decrement: cost } }
                });

                // ── (6) Safety: ensure cache never goes below 0 ──
                if (updatedProfile.credits < 0) {
                    await tx.guideProfile.update({
                        where: { userId },
                        data: { credits: 0 }
                    });
                    return { newBalance: 0, idempotent: false };
                }

                return { newBalance: updatedProfile.credits, idempotent: false };
            }, {
                // Use SERIALIZABLE isolation for maximum safety in concurrent deduction scenarios
                isolationLevel: 'Serializable',
                timeout: 10000,
            }));

            console.log(`[CreditService] Deducted ${cost} from ${userId}: ${reason}. New balance: ${result.newBalance}${result.idempotent ? ' (idempotent no-op)' : ''}`);
            return { success: true, newBalance: result.newBalance, idempotent: result.idempotent };

        } catch (error: any) {
            if (error.message === 'INSUFFICIENT_CREDITS') {
                const balance = await this.getBalance(userId);
                return { success: false, newBalance: balance };
            }
            // P2002 = unique constraint violation → idempotency key collision (parallel race both passed check)
            if (error.code === 'P2002') {
                const balance = await this.getBalance(userId);
                return { success: true, newBalance: balance, idempotent: true };
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
        relatedId?: string,
        idempotencyKey?: string
    ): Promise<number> {
        const result = await withSerializableRetry(() => prisma.$transaction(async (tx) => {
            // Idempotency check
            if (idempotencyKey) {
                const existing = await tx.creditTransaction.findUnique({
                    where: { idempotencyKey }
                });
                if (existing) {
                    const bal = await tx.creditTransaction.aggregate({
                        where: { userId },
                        _sum: { amount: true }
                    });
                    return bal._sum.amount || 0;
                }
            }

            // Write to ledger
            await tx.creditTransaction.create({
                data: {
                    userId,
                    amount,
                    type,
                    reason,
                    relatedId: relatedId || null,
                    idempotencyKey: idempotencyKey || null,
                }
            });

            // Update cache
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
        }));

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
