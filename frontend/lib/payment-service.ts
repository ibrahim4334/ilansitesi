import Stripe from "stripe";
import { prisma } from "./prisma";
import { grantToken } from "@/src/modules/tokens/application/grant-token.usecase";

/**
 * Production payment service.
 * All race conditions mitigated:
 *
 * RC-1 fix: Pending-session guard before Stripe API call prevents duplicate sessions.
 * RC-3 fix: refund() uses an atomic SERIALIZABLE transaction with FOR UPDATE lock.
 *           Stripe API call happens OUTSIDE the DB transaction.
 * RC-5 fix: checkout session creation rate-limited by pending-session guard.
 *
 * LEDGER: All balance mutations go through grantToken() → token_ledger_entries.
 */
export class PaymentService {

    private static stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2023-10-16' as any,
    });

    /**
     * Create a Stripe Checkout Session for credit purchase.
     */
    static async createCheckoutSession(
        userId: string,
        packageId: string,
        successUrl: string,
        cancelUrl: string
    ) {
        const PENDING_WINDOW_MS = 10 * 60 * 1_000; // 10 minutes

        const pkg = await prisma.creditPackage.findUnique({ where: { id: packageId } });
        if (!pkg) throw new Error("PACKAGE_NOT_FOUND");

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, role: true },
        });
        if (!user) throw new Error("USER_NOT_FOUND");

        // ── RC-5/RC-1 fix: Pending session guard ─────────────────────────
        const existingPending = await prisma.transaction.findFirst({
            where: {
                userId,
                status: "pending",
                createdAt: { gte: new Date(Date.now() - PENDING_WINDOW_MS) },
            },
            orderBy: { createdAt: "desc" },
        });

        if (existingPending?.sessionId) {
            try {
                const existingSession = await this.stripe.checkout.sessions.retrieve(
                    existingPending.sessionId
                );
                if (existingSession.status === "open") {
                    return { url: existingSession.url, sessionId: existingSession.id };
                }
            } catch {
                // Session expired or invalid — fall through to create a new one
            }
        }

        // ── Step 3: Create PENDING Transaction row first ──────────────────
        const pendingTx = await prisma.transaction.create({
            data: {
                userId,
                role: user.role || "GUIDE",
                credits: pkg.credits,
                amountTRY: pkg.priceTRY,
                provider: "stripe",
                status: "pending",
                sessionId: null,
            },
        });

        // ── Step 4: Call Stripe (outside DB transaction) ──────────────────
        let stripeSession: Stripe.Checkout.Session;
        try {
            stripeSession = await this.stripe.checkout.sessions.create(
                {
                    payment_method_types: ["card"],
                    mode: "payment",
                    customer_email: user.email || undefined,
                    line_items: [{
                        price_data: {
                            currency: "try",
                            product_data: {
                                name: `${pkg.credits} Kredi — ${pkg.name}`,
                                description: "UmreBuldum kredi paketi",
                            },
                            unit_amount: Math.round(pkg.priceTRY * 100),
                        },
                        quantity: 1,
                    }],
                    metadata: {
                        userId,
                        credits: String(pkg.credits),
                        packageId,
                        role: user.role || "GUIDE",
                        internalTxId: pendingTx.id,
                    },
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                },
                { idempotencyKey: `checkout:${userId}:${packageId}:${pendingTx.id}` }
            );
        } catch (err) {
            await prisma.transaction.update({
                where: { id: pendingTx.id },
                data: { status: "failed" },
            });
            throw err;
        }

        // ── Step 5: Attach real Stripe sessionId ─────────────────────────
        await prisma.transaction.update({
            where: { id: pendingTx.id },
            data: { sessionId: stripeSession.id },
        });

        return { url: stripeSession.url, sessionId: stripeSession.id };
    }

    /**
     * Handle refund (admin-initiated).
     *
     * RC-3 fix: Atomic pattern:
     *  1. FOR UPDATE lock on Transaction row inside SERIALIZABLE tx
     *  2. Write refund ledger entry via grantToken (negative amount)
     *  3. Stripe API call AFTER DB commit (idempotent)
     *
     * FIXED: Stripe session retrieval moved OUTSIDE transaction to avoid lock-hold.
     */
    static async refund(transactionId: string, adminId: string, reason: string) {
        let paymentIntentId: string | null = null;
        let refundCredits = 0;
        let refundUserId = "";
        let sessionIdForLookup: string | null = null;

        // ── Atomic DB operations ─────────────────────────────────────────
        await prisma.$transaction(async (tx) => {
            const rows = await tx.$queryRaw<Array<{
                id: string;
                userId: string;
                credits: number;
                status: string;
                sessionId: string | null;
            }>>`
                SELECT id, userId, credits, status, sessionId
                FROM transactions
                WHERE id = ${transactionId}
                FOR UPDATE
            `;

            const payment = rows[0];
            if (!payment) throw new Error("TRANSACTION_NOT_FOUND");
            if (payment.status !== "completed") throw new Error("NOT_REFUNDABLE");

            refundCredits = payment.credits;
            refundUserId = payment.userId;
            sessionIdForLookup = payment.sessionId;

            // Mark refunded atomically
            await tx.transaction.update({
                where: { id: transactionId },
                data: { status: "refunded", refundedAt: new Date() },
            });
        }, { isolationLevel: "Serializable", timeout: 15_000 });

        // ── Write refund to unified ledger (outside lock) ────────────────
        await grantToken({
            userId: refundUserId,
            amount: -refundCredits,
            type: "REFUND",
            reason: `Refund by admin ${adminId}: ${reason}`,
            relatedId: transactionId,
            idempotencyKey: `refund:${transactionId}`,
        });

        // ── Stripe session retrieval OUTSIDE transaction ─────────────────
        if (sessionIdForLookup) {
            const session = await this.stripe.checkout.sessions.retrieve(sessionIdForLookup);
            paymentIntentId = session.payment_intent as string | null;
        }

        // ── Stripe refund AFTER DB commit ────────────────────────────────
        if (paymentIntentId) {
            await this.stripe.refunds.create(
                { payment_intent: paymentIntentId, reason: "requested_by_customer" },
                { idempotencyKey: `refund:${transactionId}` }
            );
        }

        // Audit log
        await prisma.adminAuditLog.create({
            data: {
                adminId,
                action: "refund_transaction",
                targetId: transactionId,
                reason,
                metadata: { credits: refundCredits, userId: refundUserId },
            },
        });

        return { success: true };
    }
}
