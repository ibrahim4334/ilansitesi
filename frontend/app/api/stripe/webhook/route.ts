import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { withSerializableRetry } from "@/lib/with-retry";

if (!process.env.STRIPE_SECRET_KEY) {
    console.error("CRITICAL: STRIPE_SECRET_KEY is not defined. Payments will fail.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST /api/stripe/webhook
 *
 * Hardened idempotency guarantee (in order of execution, all inside one $transaction):
 *  1. INSERT webhook_events(eventId) — DB-level dedup on Stripe event.id
 *     → P2002 on duplicate delivery → catch → return 200 (already processed)
 *  2. UPDATE transactions SET status="completed" WHERE sessionId=? AND status="pending"
 *     → if updated.count === 0 → already settled or row missing → return 200
 *  3. INSERT credit_transactions(idempotencyKey="stripe:"+sessionId)
 *     → P2002 if somehow duplicate → caught at outer level → already processed
 *  4. UPDATE guide_profiles.credits += N
 *  ALL steps inside SERIALIZABLE $transaction → atomic, no partial commits.
 *
 * Why this pattern is safe:
 *  - Two simultaneous webhook deliveries both try step 1.
 *    Only ONE wins the INSERT; the other gets P2002 → returns 200 immediately.
 *  - The WebhookEvent row is written in the SAME transaction as the credit grant.
 *    If the credit grant fails → BOTH are rolled back → next retry starts fresh.
 *  - CreditTransaction.idempotencyKey is a SECOND idempotency gate (defense-in-depth).
 */
export async function POST(req: Request) {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
        return new NextResponse("Stripe keys missing", { status: 500 });
    }

    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // ── checkout.session.completed ─────────────────────────────────────────
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;
        const userId = metadata?.userId;
        const credits = metadata?.credits ? parseInt(metadata.credits) : 0;

        if (!userId || !credits) {
            console.error("Webhook missing metadata", { eventId: event.id });
            return new NextResponse("Invalid metadata", { status: 400 });
        }

        try {
            await withSerializableRetry(() => prisma.$transaction(async (tx) => {
                // ── Step 1: DB-level idempotency (primary gate) ───────────
                await tx.webhookEvent.create({
                    data: {
                        eventId: event.id,
                        eventType: event.type,
                        status: "processed",
                    },
                });

                // ── Step 2: Mark existing PENDING Transaction as completed ─
                const settled = await tx.transaction.updateMany({
                    where: { sessionId: session.id, status: "pending" },
                    data: { status: "completed" },
                });

                if (settled.count === 0) {
                    console.warn(`Session ${session.id}: no pending TX to settle. Already processed?`);
                    return;
                }

                // ── Step 3: Ledger entry (second idempotency gate) ────────
                await tx.creditTransaction.create({
                    data: {
                        userId,
                        amount: credits,
                        type: "purchase",
                        reason: `Stripe purchase: ${credits} credits (session ${session.id})`,
                        relatedId: session.id,
                        idempotencyKey: `stripe:${session.id}`,
                    },
                });

                // ── Step 4: Cache increment ───────────────────────────────
                await tx.guideProfile.update({
                    where: { userId },
                    data: { credits: { increment: credits } },
                });

            }, { isolationLevel: "Serializable", timeout: 15_000 }));

            console.log(`[Webhook] Credits granted: ${credits} to ${userId} (${session.id})`);

        } catch (err: any) {
            // P2002 on webhookEvent.create → duplicate event delivery → safe to skip
            if (err.code === "P2002") {
                console.log(`[Webhook] Duplicate event ${event.id} — skipping (already processed).`);
                return new NextResponse(null, { status: 200 });
            }
            // All other errors → return 5xx so Stripe retries.
            // On next retry, WebhookEvent was NOT committed (transaction rolled back),
            // so step 1 will succeed and the whole flow retries cleanly.
            console.error(`[Webhook] Error processing ${event.id}:`, err);
            return new NextResponse("Internal Server Error", { status: 500 });
        }
    }

    // ── checkout.session.expired ───────────────────────────────────────────
    if (event.type === "checkout.session.expired") {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            await prisma.$transaction(async (tx) => {
                // Idempotency gate for expired events too
                await tx.webhookEvent.create({
                    data: { eventId: event.id, eventType: event.type, status: "processed" },
                });

                // Atomic update — safe if already failed or not found
                await tx.transaction.updateMany({
                    where: { sessionId: session.id, status: "pending" },
                    data: { status: "failed" },
                });
            }, { isolationLevel: "Serializable" });

            console.log(`[Webhook] Session expired: ${session.id}`);
        } catch (err: any) {
            if (err.code === "P2002") return new NextResponse(null, { status: 200 });
            console.error(`[Webhook] Error on expired event ${event.id}:`, err);
            return new NextResponse("Internal Server Error", { status: 500 });
        }
    }

    return new NextResponse(null, { status: 200 });
}
