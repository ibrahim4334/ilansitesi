// ─── Spend Token Use Case ───────────────────────────────────────────────
// Atomic token deduction with SERIALIZABLE isolation.
// This is the SINGLE entry point for all token spending.
//
// Safety proof:
//   1. SERIALIZABLE isolation → no phantom reads, no dirty reads
//   2. FOR UPDATE on token_ledger_entries → row-level lock prevents
//      concurrent SUM from returning stale balance
//   3. Balance check (READ) happens BEFORE any WRITE
//   4. Execution order: READ → READ → GUARD → WRITE → WRITE
//      If GUARD fails, no WRITE has occurred → rollback is a no-op
//   5. Idempotency check is INSIDE the transaction → no TOCTOU race
//   6. P2002 on idempotencyKey is caught outside → graceful de-dup
//   7. withSerializableRetry handles deadlock/serialization retries
//
// Drift-proof:
//   - Ledger entry (tokenTransaction.create) and cache update
//     (user.update) are inside the SAME transaction.
//   - If either fails, both roll back atomically.
//   - No partial mutation is possible.

import { prisma } from "@/lib/prisma";
import { LedgerEntryType } from "@prisma/client";
import { withSerializableRetry } from "@/lib/with-retry";
import { TokenPolicy, type TokenAction } from "../domain/token-policy";
import { EventBus } from "@/src/core/events/event-bus";

export interface SpendTokenInput {
    userId: string;
    action: TokenAction;
    relatedId?: string;
    reason: string;
}

export interface SpendTokenResult {
    ok: boolean;
    newBalance: number;
    cost: number;
    error?: string;
}

/**
 * Atomically deduct tokens for an action.
 *
 * Execution order (mathematically safe):
 *   READ  → findUnique(idempotencyKey)        — O(1) index lookup
 *   READ  → $queryRaw SUM(amount) FOR UPDATE  — locks rows, authoritative balance
 *   GUARD → balance >= cost                   — rejects if insufficient
 *   WRITE → tokenTransaction.create           — immutable ledger entry
 *   WRITE → user.update(decrement)            — cached balance sync
 *
 * If GUARD fails → both WRITEs are skipped → ROLLBACK is a no-op.
 * If WRITE₁ fails → WRITE₂ is skipped → ROLLBACK undoes WRITE₁.
 * If WRITE₂ fails → ROLLBACK undoes both WRITE₁ and WRITE₂.
 */
export async function spendToken(input: SpendTokenInput): Promise<SpendTokenResult> {
    const cost = TokenPolicy.getCost(input.action);

    if (cost <= 0) {
        throw new Error(`Invalid cost ${cost} for action ${input.action}`);
    }

    try {
        const result = await withSerializableRetry(() =>
            prisma.$transaction(async (tx) => {
                const generatedKey = TokenService.generateIdempotencyKey(input.userId, input.action, input.relatedId);

                // ── STEP 1 (READ): Idempotency check ────────────────────
                // Inside SERIALIZABLE tx → no TOCTOU race.
                // If another transaction inserted this key concurrently,
                // SERIALIZABLE will detect the conflict and retry.
                const existing = await tx.tokenTransaction.findUnique({
                    where: { idempotencyKey: generatedKey },
                });
                if (existing) {
                    // The original code had a redundant `user` fetch here.
                    // The new logic simplifies this by returning a specific error.
                    return {
                        ok: true,
                        newBalance: -1, // We don't have the current balance easily here, but caller can fetch.
                        cost: 0,
                        error: "ALREADY_PROCESSED",
                    };
                }

                // ── STEP 2 (READ): Authoritative balance via SUM ────────
                // FOR UPDATE locks ALL matching rows in token_ledger_entries
                // for this userId, preventing concurrent transactions from
                // reading a stale SUM while we decide whether to deduct.
                //
                // CRITICAL: Uses actual MySQL table name (not Prisma model name).
                // Prisma @@map("token_ledger_entries") only applies to ORM calls,
                // NOT to raw SQL.
                const [balanceRow] = await tx.$queryRaw<[{ balance: number }]>`
                    SELECT COALESCE(SUM(amount), 0) AS balance
                    FROM token_ledger_entries
                    WHERE userId = ${input.userId}
                    FOR UPDATE
                `;
                const currentBalance = Number(balanceRow.balance);

                // ── STEP 3 (GUARD): Non-negative enforcement ────────────
                // Pure arithmetic: if balance - cost < 0, reject.
                // No writes have occurred yet → rollback is a no-op.
                if (currentBalance < cost) {
                    throw new Error("INSUFFICIENT_TOKENS");
                }

                // ── STEP 3.5 (WRITE₀): FIFO Batch Consumption ───────────
                // Drain expiring batches first (oldest expiry first).
                let remainingToConsume = cost;

                // Fetch batches with remaining amount > 0.
                // These rows are implicitly locked by the earlier FOR UPDATE on the table.
                const expiringBatches = await tx.tokenTransaction.findMany({
                    where: {
                        userId: input.userId,
                        remainingAmount: { gt: 0 },
                    },
                    orderBy: { expiresAt: "asc" },
                });

                for (const batch of expiringBatches) {
                    if (remainingToConsume <= 0) break;

                    const available = batch.remainingAmount!;
                    const consumeFromBatch = Math.min(available, remainingToConsume);

                    await tx.tokenTransaction.update({
                        where: { id: batch.id },
                        data: { remainingAmount: available - consumeFromBatch },
                    });

                    remainingToConsume -= consumeFromBatch;
                }
                // If remainingToConsume > 0, the rest is covered by non-expiring subscription tokens.

                // ── STEP 4 (WRITE₁): Immutable ledger entry ────────────
                // entryType: LedgerEntryType.CONSUME (schema enum)
                // reasonCode: business action string (for analytics)
                // referenceId: contextual ID (listingId, requestId, etc.)
                // idempotencyKey: unique constraint prevents duplicates
                await tx.tokenTransaction.create({
                    data: {
                        userId: input.userId,
                        entryType: LedgerEntryType.CONSUME,
                        amount: -cost,
                        reasonCode: `${input.action}: ${input.reason}`,
                        referenceId: input.relatedId || null,
                        idempotencyKey: generatedKey,
                    },
                });

                // ── STEP 5 (WRITE₂): Cached balance sync ───────────────
                // Uses Prisma ORM decrement → resolves tokenBalance → column
                // availableBalance via @map. Atomic SQL: SET col = col - N.
                await tx.user.update({
                    where: { id: input.userId },
                    data: { tokenBalance: { decrement: cost } },
                });

                return {
                    newBalance: currentBalance - cost,
                    alreadyProcessed: false,
                };
            }, {
                isolationLevel: "Serializable",
                timeout: 10_000,
            })
        );

        // ── POST-TX: Event emission (fire-and-forget) ───────────────
        // Outside transaction → cannot cause rollback.
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
        // ── INSUFFICIENT_TOKENS: controlled rejection ───────────────
        if (error.message === "INSUFFICIENT_TOKENS") {
            // Return current balance for UI display
            const user = await prisma.user.findUnique({
                where: { id: input.userId },
                select: { tokenBalance: true },
            });
            return {
                ok: false,
                newBalance: user?.tokenBalance ?? 0,
                cost,
                error: "INSUFFICIENT_TOKENS",
            };
        }

        // ── P2002: idempotencyKey collision (parallel race) ─────────
        // Two identical requests hit the DB simultaneously.
        // One committed, one got P2002. Return the committed state.
        if (error.code === "P2002") {
            const user = await prisma.user.findUnique({
                where: { id: input.userId },
                select: { tokenBalance: true },
            });
            return {
                ok: true,
                newBalance: user?.tokenBalance ?? 0,
                cost,
            };
        }

        throw error;
    }
}
