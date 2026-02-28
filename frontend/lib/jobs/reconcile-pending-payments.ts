import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { grantToken } from "@/src/modules/tokens/application/grant-token.usecase";
import { withSerializableRetry } from "@/lib/with-retry";

// Reconcile stale pending payment transactions.
//
// Intended to run every 10–15 minutes via cron.
// Safe to run concurrently — each row is atomically claimed via WebhookEvent dedup.
//
// LEDGER: All credit grants go through grantToken() → token_ledger_entries.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock_key", {
    apiVersion: "2023-10-16" as any,
});

const STALE_THRESHOLD_MS = 30 * 60 * 1_000; // 30 minutes

interface ReconcileResult {
    processed: number;
    credited: number;
    failed: number;
    errors: string[];
}

export async function reconcilePendingPayments(): Promise<ReconcileResult> {
    const result: ReconcileResult = { processed: 0, credited: 0, failed: 0, errors: [] };

    const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MS);

    const stalePending = await prisma.transaction.findMany({
        where: {
            status: "pending",
            createdAt: { lt: staleThreshold },
            sessionId: { not: null },
        },
        select: {
            id: true,
            userId: true,
            credits: true,
            sessionId: true,
            amountTRY: true,
            role: true,
        },
        take: 50,
    });

    for (const tx of stalePending) {
        result.processed++;
        const sessionId = tx.sessionId!;

        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            if (session.payment_status === "paid") {
                // ── Grant tokens if not already done ─────────────────────
                await withSerializableRetry(() => prisma.$transaction(async (dbTx) => {
                    // WebhookEvent row — dedup gate
                    try {
                        await dbTx.webhookEvent.create({
                            data: {
                                eventId: `reconcile:${sessionId}`,
                                eventType: "checkout.session.completed",
                                status: "processed",
                            },
                        });
                    } catch (e: any) {
                        if (e.code === "P2002") return; // Already processed
                        throw e;
                    }

                    await dbTx.transaction.updateMany({
                        where: { id: tx.id, status: "pending" },
                        data: { status: "completed" },
                    });
                }, { isolationLevel: "Serializable" }));

                // Grant via unified ledger (has its own atomic transaction)
                await grantToken({
                    userId: tx.userId,
                    amount: tx.credits,
                    type: "PURCHASE",
                    reason: `Reconciled: ${tx.credits} tokens (session ${sessionId})`,
                    relatedId: sessionId,
                    idempotencyKey: `stripe:${sessionId}`,
                });

                result.credited++;
                console.log(`[Reconcile] Credited ${tx.credits} to ${tx.userId} via ${sessionId}`);

            } else {
                await prisma.transaction.updateMany({
                    where: { id: tx.id, status: "pending" },
                    data: { status: "failed" },
                });
                result.failed++;
                console.log(`[Reconcile] Marked failed: ${sessionId} (status: ${session.status})`);
            }

        } catch (err: any) {
            if (err.code === "P2002") {
                console.log(`[Reconcile] Already credited: ${sessionId}`);
                continue;
            }
            const msg = `[Reconcile] Error on ${sessionId}: ${err.message}`;
            console.error(msg);
            result.errors.push(msg);
        }
    }

    // Mark PENDING rows with no sessionId as failed
    const orphaned = await prisma.transaction.updateMany({
        where: {
            status: "pending",
            sessionId: null,
            createdAt: { lt: staleThreshold },
        },
        data: { status: "failed" },
    });

    if (orphaned.count > 0) {
        console.log(`[Reconcile] Marked ${orphaned.count} orphaned sessions as failed.`);
    }

    return result;
}
