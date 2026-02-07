
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key', {
    apiVersion: '2023-10-16', // Use a stable version usually
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

        console.log(`Processing payment for user ${userId}, credits: ${credits}`);

        const database = db.read();

        let profile = database.guideProfiles.find(p => p.userId === userId);

        // If profile not found, maybe create it? Or log error.
        if (!profile) {
            console.error(`Profile not found for userId: ${userId}`);
            // Attempt to find user to logging
            const user = database.users.find((u: any) => u.id === userId);
            if (user) {
                // Auto-create profile similar to other endpoints
                profile = {
                    userId: user.id,
                    fullName: user.name || "Unknown Guide",
                    phone: "",
                    city: "",
                    bio: "",
                    photo: "",
                    isDiyanet: false,
                    quotaTarget: 30,
                    currentCount: 0,
                    isApproved: false,
                    credits: 0
                };
                database.guideProfiles.push(profile);
            } else {
                return new NextResponse("User not found", { status: 404 });
            }
        }

        if (profile.credits === undefined) profile.credits = 0;
        profile.credits += credits;

        // Update Transaction Status
        const transaction = database.transactions.find((t: any) => t.sessionId === session.id);
        if (transaction) {
            transaction.status = "completed";
        } else {
            // If we missed the pending one for some reason
            database.transactions.push({
                id: crypto.randomUUID(),
                userId,
                role: metadata.role || 'GUIDE',
                credits,
                amountTRY: session.amount_total ? session.amount_total / 100 : 0,
                provider: "stripe",
                status: "completed",
                sessionId: session.id,
                createdAt: new Date().toISOString()
            });
        }

        db.write(database);
        console.log(`Credits added successfully. New balance: ${profile.credits}`);
    }

    return new NextResponse(null, { status: 200 });
}
