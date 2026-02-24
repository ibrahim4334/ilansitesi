// ─── Token Renewal Use Case ─────────────────────────────────────────────
// Monthly subscription token renewal with soft cap enforcement.

import { prisma } from "@/lib/prisma";
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
            // Check if already renewed this month
            const existing = await prisma.tokenTransaction.findUnique({
                where: { idempotencyKey },
            });
            if (existing) {
                skipped++;
                continue;
            }

            const newBalance = TokenPolicy.calculateRenewal(
                user.tokenBalance,
                user.packageType,
            );
            const grantAmount = newBalance - user.tokenBalance;

            if (grantAmount <= 0) {
                skipped++; // Already at or above soft cap
                continue;
            }

            await prisma.$transaction([
                prisma.tokenTransaction.create({
                    data: {
                        userId: user.id,
                        type: "SUBSCRIPTION",
                        amount: grantAmount,
                        reason: `Monthly renewal (${monthKey})`,
                        idempotencyKey,
                    },
                }),
                prisma.user.update({
                    where: { id: user.id },
                    data: { tokenBalance: newBalance },
                }),
            ]);

            EventBus.emit("TOKEN_RENEWED", {
                userId: user.id,
                granted: grantAmount,
                newBalance,
                month: monthKey,
            });

            processed++;
        } catch (error) {
            console.error(`[Renewal] Failed for user ${user.id}:`, error);
            errors++;
        }
    }

    console.log(`[Renewal] Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`);
    return { processed, skipped, errors };
}
