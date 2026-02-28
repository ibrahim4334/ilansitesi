// ─── Grant Token Use Case ───────────────────────────────────────────────
// Handles all token credit operations: purchases, admin grants, onboarding, refunds.
// SINGLE entry point for adding tokens to any user account.
//
// Safety guarantees:
//   1. Idempotency check INSIDE SERIALIZABLE $transaction (no TOCTOU)
//   2. P2002 (unique constraint) caught gracefully for parallel race
//   3. withSerializableRetry handles deadlock/serialization failures

import { prisma } from "@/lib/prisma";
import { withSerializableRetry } from "@/lib/with-retry";
import { LedgerEntryType } from "@prisma/client";
import { EventBus } from "@/src/core/events/event-bus";
import { TOKEN_EXPIRY_DAYS } from "@/lib/package-system";

export interface GrantTokenInput {
    userId: string;
    amount: number;
    type: "PURCHASE" | "ADMIN_GRANT" | "SUBSCRIPTION" | "REFUND" | "INITIAL_BALANCE";
    reason: string;
    relatedId?: string;
    idempotencyKey: string; // MANDATORY — no optional
}

export interface GrantTokenResult {
    ok: boolean;
    newBalance: number;
    alreadyProcessed?: boolean;
}

/**
 * Grant tokens to a user. Not subject to soft cap (purchases are uncapped).
 * Uses idempotency key to prevent duplicate grants.
 *
 * idempotencyKey is MANDATORY for every call.
 */
export async function grantToken(input: GrantTokenInput): Promise<GrantTokenResult> {
    if (!input.idempotencyKey || input.idempotencyKey.trim().length === 0) {
        throw new Error("idempotencyKey is mandatory for grantToken()");
    }
    // Allow amount=0 ONLY for INITIAL_BALANCE (ledger seed for users with 0 tokens).
    // All other types must have a non-zero amount.
    if (input.amount === 0 && input.type !== "INITIAL_BALANCE") {
        throw new Error("Grant amount cannot be zero (except INITIAL_BALANCE)");
    }

    try {
        const result = await withSerializableRetry(() =>
            prisma.$transaction(async (tx) => {
                // ── (1) Idempotency check INSIDE the transaction ──────────
                const existing = await tx.tokenTransaction.findUnique({
                    where: { idempotencyKey: input.idempotencyKey },
                });
                if (existing) {
                    const user = await tx.user.findUnique({
                        where: { id: input.userId },
                        select: { tokenBalance: true },
                    });
                    return { newBalance: user?.tokenBalance ?? 0, alreadyProcessed: true };
                }

                // ── (2) Map type string to LedgerEntryType enum ──────────
                const entryTypeMap: Record<string, LedgerEntryType> = {
                    PURCHASE: LedgerEntryType.PURCHASE,
                    ADMIN_GRANT: LedgerEntryType.ADJUSTMENT,
                    SUBSCRIPTION: LedgerEntryType.PURCHASE,
                    REFUND: LedgerEntryType.REFUND,
                    INITIAL_BALANCE: LedgerEntryType.ADJUSTMENT,
                };

                // ── (3) Calculate Expiry ──────────────────────────────────
                let expiresAt: Date | null = null;
                if (input.type === "PURCHASE") {
                    expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS.PURCHASED);
                } else if (input.type === "INITIAL_BALANCE" || input.type === "ADMIN_GRANT") {
                    expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS.PROMO);
                }
                const remainingAmount = expiresAt ? input.amount : null;

                // ── (4) Create immutable ledger entry ─────────────────────
                await tx.tokenTransaction.create({
                    data: {
                        userId: input.userId,
                        entryType: entryTypeMap[input.type] || LedgerEntryType.ADJUSTMENT,
                        amount: input.amount,
                        referenceId: input.relatedId || null,
                        idempotencyKey: input.idempotencyKey,
                        reasonCode: input.reason,
                        expiresAt,
                        remainingAmount,
                    },
                });

                // ── (4) Update cached balance ─────────────────────────────
                const user = await tx.user.update({
                    where: { id: input.userId },
                    data: { tokenBalance: { increment: input.amount } },
                });

                return { newBalance: user.tokenBalance, alreadyProcessed: false };
            }, {
                isolationLevel: "Serializable",
                timeout: 10_000,
            })
        );

        // Fire event outside transaction (fire-and-forget)
        if (!result.alreadyProcessed) {
            EventBus.emit("TOKEN_GRANTED", {
                userId: input.userId,
                amount: input.amount,
                type: input.type,
                newBalance: result.newBalance,
            });
        }

        return { ok: true, newBalance: result.newBalance, alreadyProcessed: result.alreadyProcessed };

    } catch (error: any) {
        // P2002 = unique constraint on idempotencyKey — parallel race resolved
        if (error.code === "P2002") {
            const user = await prisma.user.findUnique({
                where: { id: input.userId },
                select: { tokenBalance: true },
            });
            return { ok: true, newBalance: user?.tokenBalance ?? 0, alreadyProcessed: true };
        }
        throw error;
    }
}
