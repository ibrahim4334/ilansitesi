import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { withSerializableRetry } from "@/lib/with-retry";
import { grantToken } from "@/src/modules/tokens/application/grant-token.usecase";

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
 * Hardened idempotency guarantee:
 *  1. INSERT webhook_events(eventId) — DB-level dedup on Stripe event.id
 *  2. UPDATE transactions SET status="completed" WHERE sessionId=? AND status="pending"
 *  3. grantToken() — writes to token_ledger_entries with idempotencyKey="stripe:"+sessionId
 *     grantToken has its own internal idempotency (defense-in-depth)
 *
 *  Steps 1-2 in SERIALIZABLE $transaction, step 3 has its own atomic transaction.
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
            // Step 1-2: Webhook dedup + transaction settlement
            await withSerializableRetry(() => prisma.$transaction(async (tx) => {
                // DB-level idempotency (primary gate)
                await tx.webhookEvent.create({
                    data: {
                        eventId: event.id,
                        eventType: event.type,
                        status: "processed",
                    },
                });

                // Mark existing PENDING Transaction as completed
                const settled = await tx.transaction.updateMany({
                    where: { sessionId: session.id, status: "pending" },
                    data: { status: "completed" },
                });

                if (settled.count === 0) {
                    console.warn(`Session ${session.id}: no pending TX to settle. Already processed?`);
                    return;
                }
            }, { isolationLevel: "Serializable", timeout: 15_000 }));

            // Step 3: Grant tokens via unified ledger (has its own atomic transaction)
            await grantToken({
                userId,
                amount: credits,
                type: "PURCHASE",
                reason: `Stripe purchase: ${credits} tokens (session ${session.id})`,
                relatedId: session.id,
                idempotencyKey: `stripe:${session.id}`,
            });

            console.log(`[Webhook] Tokens granted: ${credits} to ${userId} (${session.id})`);

        } catch (err: any) {
            // P2002 on webhookEvent.create → duplicate event delivery → safe to skip
            if (err.code === "P2002") {
                console.log(`[Webhook] Duplicate event ${event.id} — skipping (already processed).`);
                return new NextResponse(null, { status: 200 });
            }
            console.error(`[Webhook] Error processing ${event.id}:`, err);
            return new NextResponse("Internal Server Error", { status: 500 });
        }
    }

    // ── checkout.session.expired ───────────────────────────────────────────
    if (event.type === "checkout.session.expired") {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            await prisma.$transaction(async (tx) => {
                await tx.webhookEvent.create({
                    data: { eventId: event.id, eventType: event.type, status: "processed" },
                });
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
