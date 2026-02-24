// ─── Spend Token Use Case ───────────────────────────────────────────────
// Atomic token deduction with SERIALIZABLE isolation.
// This is the single point of token spending — all controllers delegate here.

import { prisma } from "@/lib/prisma";
import { withSerializableRetry } from "@/lib/with-retry";
import { TokenPolicy, type TokenAction } from "../domain/token-policy";
import { EventBus } from "@/src/core/events/event-bus";

export interface SpendTokenInput {
    userId: string;
    action: TokenAction;
    relatedId: string;
    reason: string;
    idempotencyKey: string;
}

export interface SpendTokenResult {
    ok: boolean;
    newBalance: number;
    cost: number;
    error?: string;
}

/**
 * Atomically deduct tokens for an action.
 * Uses SERIALIZABLE + FOR UPDATE to prevent double-spend.
 */
export async function spendToken(input: SpendTokenInput): Promise<SpendTokenResult> {
    const cost = TokenPolicy.getCost(input.action);

    try {
        const result = await withSerializableRetry(() =>
            prisma.$transaction(async (tx) => {
                // (1) Check idempotency
                const existing = await tx.tokenTransaction.findUnique({
                    where: { idempotencyKey: input.idempotencyKey },
                });
                if (existing) {
                    // Already processed — return current balance
                    const user = await tx.user.findUnique({
                        where: { id: input.userId },
                        select: { tokenBalance: true },
                    });
                    return { newBalance: user?.tokenBalance ?? 0, alreadyProcessed: true };
                }

                // (2) Lock + authoritative balance check
                const [balanceRow] = await tx.$queryRaw<[{ balance: number }]>`
                    SELECT COALESCE(SUM(amount), 0) AS balance
                    FROM token_transactions
                    WHERE userId = ${input.userId}
                    FOR UPDATE
                `;
                const currentBalance = Number(balanceRow.balance);

                if (currentBalance < cost) {
                    throw new Error("INSUFFICIENT_TOKENS");
                }

                // (3) Create deduction record
                await tx.tokenTransaction.create({
                    data: {
                        userId: input.userId,
                        type: input.action,
                        amount: -cost,
                        reason: input.reason,
                        relatedId: input.relatedId,
                        idempotencyKey: input.idempotencyKey,
                    },
                });

                // (4) Update cached balance
                await tx.user.update({
                    where: { id: input.userId },
                    data: { tokenBalance: { decrement: cost } },
                });

                return { newBalance: currentBalance - cost, alreadyProcessed: false };
            }, {
                isolationLevel: "Serializable",
                timeout: 10_000,
            }),
        );

        // Emit event (fire-and-forget)
        if (!result.alreadyProcessed) {
            EventBus.emit("TOKEN_SPENT", {
                userId: input.userId,
                action: input.action,
                cost,
                newBalance: result.newBalance,
                relatedId: input.relatedId,
            });
        }

        return { ok: true, newBalance: result.newBalance, cost };

    } catch (error: any) {
        if (error.message === "INSUFFICIENT_TOKENS") {
            return { ok: false, newBalance: 0, cost, error: "INSUFFICIENT_TOKENS" };
        }
        throw error;
    }
}
