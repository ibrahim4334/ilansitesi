// ─── Token Expiry Cleanup ───────────────────────────────────────────────
// Daily cron job: expires purchased/promo tokens past their expiresAt date.
// Creates EXPIRY ledger entries and adjusts cached balance.
//
// Token Lifecycle:
//   Subscription tokens: expiresAt = null → never expire (soft cap limits accumulation)
//   Purchased tokens:    expiresAt = createdAt + 90 days
//   Promo tokens:        expiresAt = createdAt + 30 days
//
// FIFO: Spending always consumes oldest expiring tokens first.
// This job catches any remainingAmount > 0 past expiresAt.

import { prisma } from "@/lib/prisma";
import { LedgerEntryType } from "@prisma/client";

const BATCH_SIZE = 100;
const MAX_BATCHES = 50;

export interface ExpiryResult {
    expired: number;
    tokensRemoved: number;
    errors: number;
}

/**
 * Process expired token batches.
 * Creates negative ledger entries for each expired batch.
 * Updates user's cached tokenBalance.
 *
 * Safe to run multiple times (idempotent via remainingAmount = 0).
 */
export async function processTokenExpiry(): Promise<ExpiryResult> {
    let expired = 0;
    let tokensRemoved = 0;
    let errors = 0;

    for (let batch = 0; batch < MAX_BATCHES; batch++) {
        // Find expired token batches with remaining balance
        const expiredBatches = await prisma.tokenTransaction.findMany({
            where: {
                expiresAt: { lt: new Date() },
                remainingAmount: { gt: 0 },
                amount: { gt: 0 },  // Only positive (grant) entries can expire
            },
            select: {
                id: true,
                userId: true,
                remainingAmount: true,
                reasonCode: true,
            },
            take: BATCH_SIZE,
        });

        if (expiredBatches.length === 0) break;

        // Group by user for efficient balance updates
        const userExpiries = new Map<string, { batchIds: string[]; totalAmount: number }>();

        for (const batch of expiredBatches) {
            const existing = userExpiries.get(batch.userId) || { batchIds: [], totalAmount: 0 };
            existing.batchIds.push(batch.id);
            existing.totalAmount += batch.remainingAmount!;
            userExpiries.set(batch.userId, existing);
        }

        // Process each user's expired batches
        for (const [userId, { batchIds, totalAmount }] of userExpiries) {
            try {
                await prisma.$transaction(async (tx) => {
                    // 1. Zero out remaining amounts on expired batches
                    await tx.tokenTransaction.updateMany({
                        where: { id: { in: batchIds } },
                        data: { remainingAmount: 0 },
                    });

                    // 2. Create expiry ledger entry (negative)
                    await tx.tokenTransaction.create({
                        data: {
                            userId,
                            entryType: LedgerEntryType.CONSUME,
                            amount: -totalAmount,
                            idempotencyKey: `expiry:${userId}:${batchIds.join(",")}`,
                            reasonCode: `Token expiry (${batchIds.length} batch(es))`,
                        },
                    });

                    // 3. Update cached balance
                    await tx.user.update({
                        where: { id: userId },
                        data: { tokenBalance: { decrement: totalAmount } },
                    });
                });

                expired += batchIds.length;
                tokensRemoved += totalAmount;
            } catch (error: any) {
                // P2002 = already processed (idempotencyKey conflict)
                if (error.code === "P2002") {
                    expired += batchIds.length;
                    continue;
                }
                console.error(`[TokenExpiry] Failed for user ${userId}:`, error);
                errors++;
            }
        }
    }

    console.log(`[TokenExpiry] Expired: ${expired} batches, Removed: ${tokensRemoved} tokens, Errors: ${errors}`);
    return { expired, tokensRemoved, errors };
}
