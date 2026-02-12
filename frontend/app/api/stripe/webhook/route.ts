import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TokenService } from "@/lib/token-service";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key', {
    apiVersion: '2023-10-16' as any,
    typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
        const metadata = session.metadata;
        const userId = metadata?.userId;
        const credits = metadata?.credits ? parseInt(metadata.credits) : 0;

        if (!userId || !credits) {
            console.error("Webhook missing metadata");
            return new NextResponse("Invalid metadata", { status: 400 });
        }

        // ─── IDEMPOTENCY: Check if already processed BEFORE granting ───
        const existingTx = await prisma.transaction.findFirst({
            where: { sessionId: session.id }
        });

        if (existingTx && existingTx.status === "completed") {
            console.log(`Webhook already processed for session ${session.id}. Skipping.`);
            return new NextResponse(null, { status: 200 });
        }

        console.log(`Processing payment for user ${userId}, credits: ${credits}`);

        // ─── Insert CreditTransaction (source of truth) + update cache ───
        const newBalance = await TokenService.grantCredits(
            userId,
            credits,
            "purchase",
            `Stripe purchase: ${credits} credits (session ${session.id})`,
            session.id
        );

        // ─── Update/Create Stripe Transaction record ───
        if (existingTx) {
            await prisma.transaction.update({
                where: { id: existingTx.id },
                data: { status: "completed" }
            });
        } else {
            await prisma.transaction.create({
                data: {
                    userId,
                    role: metadata?.role || 'GUIDE',
                    credits,
                    amountTRY: session.amount_total ? session.amount_total / 100 : 0,
                    provider: "stripe",
                    status: "completed",
                    sessionId: session.id,
                }
            });
        }

        console.log(`Credits added successfully. New balance: ${newBalance}`);
    }

    if (event.type === "checkout.session.expired") {
        // Mark transaction as failed — no credits granted
        const existingTx = await prisma.transaction.findFirst({
            where: { sessionId: session.id }
        });

        if (existingTx) {
            await prisma.transaction.update({
                where: { id: existingTx.id },
                data: { status: "failed" }
            });
        }

        console.log(`Checkout session expired: ${session.id}`);
    }

    return new NextResponse(null, { status: 200 });
}
