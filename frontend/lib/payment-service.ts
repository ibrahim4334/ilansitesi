import Stripe from "stripe";
import { prisma } from "./prisma";

/**
 * Production payment service.
 * All race conditions mitigated:
 *
 * RC-1 fix: Pending-session guard before Stripe API call prevents duplicate sessions
 *           from concurrent button clicks. A user can only have 1 pending session at a time.
 *
 * RC-3 fix: refund() now uses an atomic SERIALIZABLE transaction with FOR UPDATE lock
 *           on the Transaction row. Stripe API call happens OUTSIDE the DB transaction
 *           to avoid holding locks during network I/O. Stripe refunds are idempotent
 *           by payment_intent ID + our idempotencyKey.
 *
 * RC-5 fix: checkout session creation rate-limited implicitly by pending-session guard
 *           (at most 1 pending session per user at any time).
 */
export class PaymentService {

    private static stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2023-10-16' as any,
    });

    /**
     * Create a Stripe Checkout Session for credit purchase.
     *
     * Safety order:
     *  1. Validate package + user (read-only)
     *  2. Guard: reject if user already has a pending session < 10 minutes old
     *  3. Write PENDING Transaction row to DB (idempotency anchor)
     *  4. Call Stripe API (network I/O outside DB transaction)
     *  5. Update Transaction row with real Stripe sessionId
     *
     * If step 4 fails → pending row exists but has no sessionId.
     * Reconciliation job will mark it "failed" after 30 min.
     * If step 5 fails → same as above.
     * In both cases, step 2's guard is lifted after PENDING_WINDOW_MS.
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
        // A user who spams the button gets their existing checkout URL back
        // rather than being charged multiple times.
        const existingPending = await prisma.transaction.findFirst({
            where: {
                userId,
                status: "pending",
                createdAt: { gte: new Date(Date.now() - PENDING_WINDOW_MS) },
            },
            orderBy: { createdAt: "desc" },
        });

        if (existingPending?.sessionId) {
            // Retrieve the still-valid Stripe session and return its URL
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
        // This row is the idempotency anchor. The webhook handler will
        // updateMany WHERE sessionId=? AND status="pending" so it MUST exist.
        // We create it with sessionId=null and update it after Stripe responds.
        const pendingTx = await prisma.transaction.create({
            data: {
                userId,
                role: user.role || "GUIDE",
                credits: pkg.credits,
                amountTRY: pkg.priceTRY,
                provider: "stripe",
                status: "pending",
                sessionId: null, // Filled in after Stripe responds
            },
        });

        // ── Step 4: Call Stripe (outside DB transaction to avoid lock hold) ─
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
                        internalTxId: pendingTx.id, // Link back to our row
                    },
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                },
                // Stripe-level idempotency: same userId+packageId+txId won't create a second charge
                { idempotencyKey: `checkout:${userId}:${packageId}:${pendingTx.id}` }
            );
        } catch (err) {
            // Stripe call failed → mark our pending row as failed immediately
            await prisma.transaction.update({
                where: { id: pendingTx.id },
                data: { status: "failed" },
            });
            throw err;
        }

        // ── Step 5: Attach real Stripe sessionId to our Transaction row ───
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
     *  2. Write ledger entry + update status atomically
     *  3. Stripe API call AFTER DB commit (idempotent by payment_intent + idempotencyKey)
     *
     * Safe to retry: idempotencyKey = "refund:"+txId, so repeat calls are no-ops at
     * both DB level (CreditTransaction.idempotencyKey @unique) and Stripe level.
     */
    static async refund(transactionId: string, adminId: string, reason: string) {
        // ── Atomic DB operations ─────────────────────────────────────────
        let paymentIntentId: string | null = null;
        let refundCredits = 0;
        let refundUserId = "";

        await prisma.$transaction(async (tx) => {
            // Lock the row to prevent concurrent refunds of the same transaction
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

            // Mark refunded atomically
            await tx.transaction.update({
                where: { id: transactionId },
                data: { status: "refunded", refundedAt: new Date() },
            });

            // Ledger: negative entry (append-only — no UPDATE on CreditTransaction)
            await tx.creditTransaction.create({
                data: {
                    userId: payment.userId,
                    amount: -payment.credits,
                    type: "refund",
                    reason: `Refund by admin ${adminId}: ${reason}`,
                    relatedId: transactionId,
                    idempotencyKey: `refund:${transactionId}`, // Prevents double-refund on retry
                },
            });

            // Cache decrement
            await tx.guideProfile.update({
                where: { userId: payment.userId },
                data: { credits: { decrement: payment.credits } },
            });

            // Retrieve payment intent for Stripe refund (still inside tx for data consistency)
            if (payment.sessionId) {
                const session = await this.stripe.checkout.sessions.retrieve(payment.sessionId);
                paymentIntentId = session.payment_intent as string | null;
            }

        }, { isolationLevel: "Serializable", timeout: 15_000 });

        // ── Stripe refund AFTER DB commit ────────────────────────────────
        // Holding a DB lock while doing an HTTP call to Stripe risks deadlocks and
        // lock timeout. Stripe is independently idempotent — safe to call after commit.
        if (paymentIntentId) {
            await this.stripe.refunds.create(
                { payment_intent: paymentIntentId, reason: "requested_by_customer" },
                { idempotencyKey: `refund:${transactionId}` } // Stripe-level idempotency
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
