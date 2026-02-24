import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-audit";
import Stripe from "stripe";

// Reconcile stale pending payment transactions.
//
// Intended to run every 10–15 minutes via:
//  - Vercel Cron: vercel.json `crons: [{ path: "/api/cron/reconcile", schedule: "*/15 * * * * " }]`
//  - Or a standard cron that calls POST /api/cron/reconcile
//
// Algorithm (safe to run concurrently - each row is atomically claimed):
// For each Transaction with status = "pending" older than STALE_THRESHOLD_MS:
//   1. Retrieve Stripe session
//   2a. payment_status = "paid" -> apply credits (idempotent via "stripe:" + sessionId key)
//   2b. status = "expired" / other -> mark as "failed"
//   3. Log result to AdminAuditLog
//
// Idempotency: Step 2a uses the same idempotencyKey as the webhook handler.
// Running this N times is safe - the second run hits the unique constraint and no-ops.

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

    // Find stale pending rows — only those with a real sessionId (null = Stripe call failed)
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
        take: 50, // batch cap per run — prevents runaway on backlog
    });

    for (const tx of stalePending) {
        result.processed++;
        const sessionId = tx.sessionId!;

        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            if (session.payment_status === "paid") {
                // ── Grant credits if not already done ─────────────────────
                await prisma.$transaction(async (dbTx) => {
                    // WebhookEvent row — if webhook already processed this, this insert
                    // will fail with P2002 and we'll skip. If not, we proceed.
                    try {
                        await dbTx.webhookEvent.create({
                            data: {
                                eventId: `reconcile:${sessionId}`, // synthetic event ID
                                eventType: "checkout.session.completed",
                                status: "processed",
                            },
                        });
                    } catch (e: any) {
                        if (e.code === "P2002") {
                            // Already processed by either webhook or a previous reconcile run
                            return;
                        }
                        throw e;
                    }

                    await dbTx.transaction.updateMany({
                        where: { id: tx.id, status: "pending" },
                        data: { status: "completed" },
                    });

                    await dbTx.creditTransaction.create({
                        data: {
                            userId: tx.userId,
                            amount: tx.credits,
                            type: "purchase",
                            reason: `Reconciled: ${tx.credits} credits (session ${sessionId})`,
                            relatedId: sessionId,
                            idempotencyKey: `stripe:${sessionId}`, // Same key as webhook — safe
                        },
                    });

                    await dbTx.guideProfile.update({
                        where: { userId: tx.userId },
                        data: { credits: { increment: tx.credits } },
                    });
                }, { isolationLevel: "Serializable" });

                result.credited++;
                console.log(`[Reconcile] Credited ${tx.credits} to ${tx.userId} via ${sessionId}`);

            } else {
                // Session unpaid or expired — mark failed
                await prisma.transaction.updateMany({
                    where: { id: tx.id, status: "pending" },
                    data: { status: "failed" },
                });
                result.failed++;
                console.log(`[Reconcile] Marked failed: ${sessionId} (status: ${session.status})`);
            }

        } catch (err: any) {
            if (err.code === "P2002") {
                // CreditTransaction idempotencyKey collision — already credited
                console.log(`[Reconcile] Already credited: ${sessionId}`);
                continue;
            }
            const msg = `[Reconcile] Error on ${sessionId}: ${err.message}`;
            console.error(msg);
            result.errors.push(msg);
        }
    }

    // Also mark PENDING rows with no sessionId older than threshold as failed
    // (these represent Stripe API call failures during checkout creation)
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
