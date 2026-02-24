// ─── Grant Token Use Case ───────────────────────────────────────────────
// Handles all token credit operations: purchases, admin grants, onboarding.

import { prisma } from "@/lib/prisma";
import { EventBus } from "@/src/core/events/event-bus";

export interface GrantTokenInput {
    userId: string;
    amount: number;
    type: "PURCHASE" | "ADMIN_GRANT" | "SUBSCRIPTION" | "REFUND";
    reason: string;
    relatedId?: string;
    idempotencyKey?: string;
}

export interface GrantTokenResult {
    ok: boolean;
    newBalance: number;
}

/**
 * Grant tokens to a user. Not subject to soft cap (purchases are uncapped).
 * Uses idempotency key to prevent duplicate grants.
 */
export async function grantToken(input: GrantTokenInput): Promise<GrantTokenResult> {
    // Idempotency check
    if (input.idempotencyKey) {
        const existing = await prisma.tokenTransaction.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
        });
        if (existing) {
            const user = await prisma.user.findUnique({
                where: { id: input.userId },
                select: { tokenBalance: true },
            });
            return { ok: true, newBalance: user?.tokenBalance ?? 0 };
        }
    }

    const [, user] = await prisma.$transaction([
        prisma.tokenTransaction.create({
            data: {
                userId: input.userId,
                type: input.type,
                amount: input.amount,
                reason: input.reason,
                relatedId: input.relatedId || null,
                idempotencyKey: input.idempotencyKey || null,
            },
        }),
        prisma.user.update({
            where: { id: input.userId },
            data: { tokenBalance: { increment: input.amount } },
        }),
    ]);

    EventBus.emit("TOKEN_GRANTED", {
        userId: input.userId,
        amount: input.amount,
        type: input.type,
        newBalance: user.tokenBalance,
    });

    return { ok: true, newBalance: user.tokenBalance };
}
