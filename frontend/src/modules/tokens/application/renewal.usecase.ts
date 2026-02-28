// ─── Token Renewal Use Case ─────────────────────────────────────────────
// Monthly subscription token renewal with soft cap enforcement.
//
// Safety guarantees:
//   1. Idempotency check INSIDE SERIALIZABLE interactive $transaction
//   2. withSerializableRetry handles deadlock/serialization failures
//   3. P2002 on idempotencyKey caught gracefully

import { prisma } from "@/lib/prisma";
import { withSerializableRetry } from "@/lib/with-retry";
import { LedgerEntryType } from "@prisma/client";
import { TokenPolicy } from "../domain/token-policy";
import { TokenRepository } from "../infrastructure/token.repository";
import { EventBus } from "@/src/core/events/event-bus";

export interface RenewalResult {
    processed: number;
    skipped: number;
    errors: number;
}

/**
 * Process monthly token renewal for all paid users.
 * Uses idempotency key (month-based) to prevent double renewal.
 */
export async function processMonthlyRenewal(): Promise<RenewalResult> {
    const eligible = await TokenRepository.findRenewalEligible();
    const monthKey = new Date().toISOString().slice(0, 7); // "2026-02"
    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of eligible) {
        const idempotencyKey = `renewal:${user.id}:${monthKey}`;

        try {
            const result = await withSerializableRetry(() =>
                prisma.$transaction(async (tx) => {
                    // ── (1) Idempotency check INSIDE transaction ──────────
                    const existing = await tx.tokenTransaction.findUnique({
                        where: { idempotencyKey },
                    });
                    if (existing) return null; // Already renewed this month

                    const newBalance = TokenPolicy.calculateRenewal(
                        user.tokenBalance,
                        user.packageType,
                    );
                    const grantAmount = newBalance - user.tokenBalance;

                    if (grantAmount <= 0) return null; // Already at or above soft cap

                    // ── (2) Create immutable ledger entry ─────────────────
                    await tx.tokenTransaction.create({
                        data: {
                            userId: user.id,
                            entryType: LedgerEntryType.PURCHASE,
                            amount: grantAmount,
                            idempotencyKey,
                            reasonCode: `Monthly renewal (${monthKey})`,
                        },
                    });

                    // ── (3) Update cached balance ─────────────────────────
                    await tx.user.update({
                        where: { id: user.id },
                        data: { tokenBalance: newBalance },
                    });

                    return grantAmount;
                }, {
                    isolationLevel: "Serializable",
                    timeout: 10_000,
                })
            );

            if (result === null) {
                skipped++;
            } else {
                EventBus.emit("TOKEN_RENEWED", {
                    userId: user.id,
                    granted: result,
                    month: monthKey,
                });
                processed++;
            }

        } catch (error: any) {
            // P2002 = duplicate idempotencyKey — already processed by parallel cron
            if (error.code === "P2002") {
                skipped++;
                continue;
            }
            console.error(`[Renewal] Failed for user ${user.id}:`, error);
            errors++;
        }
    }

    console.log(`[Renewal] Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`);
    return { processed, skipped, errors };
}
