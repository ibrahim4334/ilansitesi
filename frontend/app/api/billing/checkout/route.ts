import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { requireSupply } from "@/lib/api-guards";
import { PaymentService } from "@/lib/payment-service";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/billing/checkout
 *
 * Creates a Stripe Checkout session for credit purchase.
 * Delegates entirely to PaymentService.createCheckoutSession() which enforces:
 *
 * 1. Pending-session guard   — if user already has an open session < 10min, return its URL
 *                               (prevents duplicate charges from button spam)
 * 2. DB-first ordering       — Transaction row created BEFORE Stripe API call
 *                               (if Stripe fails, row is marked "failed" by reconciler)
 * 3. Stripe idempotency key  — "checkout:userId:packageId:txId" prevents Stripe-side
 *                               duplicate charges on network retry
 * 4. Audit trail             — every attempt creates a Transaction row regardless of outcome
 *
 * Rate limit: 3 attempts per minute per user (prevents brute-force package probing).
 */
export async function POST(req: Request) {
    try {
        const session = await auth();

        // Only GUIDE and ORGANIZATION roles can purchase credits
        const guard = requireSupply(session);
        if (guard) return guard;

        // Rate limit: 3 checkout initiations per minute per user
        const userId = session!.user.email!;
        const rl = rateLimit(`checkout:${userId}`, 60_000, 3);
        if (!rl.success) {
            return NextResponse.json(
                { error: "Too many requests. Please wait before trying again." },
                {
                    status: 429,
                    headers: { "Retry-After": "60" },
                }
            );
        }

        const body = await req.json();
        const { packageId } = body;

        if (!packageId || typeof packageId !== "string") {
            return NextResponse.json({ error: "Missing or invalid packageId" }, { status: 400 });
        }

        const baseUrl = process.env.NEXTAUTH_URL;
        if (!baseUrl) {
            console.error("[Checkout] NEXTAUTH_URL environment variable not set");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Find the user's DB id from session email
        const { prisma } = await import("@/lib/prisma");
        const user = await prisma.user.findUnique({
            where: { email: session!.user.email! },
            select: { id: true },
        });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log(`[Checkout] Initiating for user ${user.id}, package ${packageId}`);

        // Delegate to PaymentService — all idempotency, ordering, and guard logic is there
        const result = await PaymentService.createCheckoutSession(
            user.id,
            packageId,
            `${baseUrl}/dashboard/billing?success=true`,
            `${baseUrl}/dashboard/billing?canceled=true`
        );

        console.log(`[Checkout] Session created: ${result.sessionId} for user ${user.id}`);
        return NextResponse.json({ url: result.url, sessionId: result.sessionId });

    } catch (err: any) {
        // Surface friendly errors from PaymentService guards
        if (err.message === "PACKAGE_NOT_FOUND") {
            return NextResponse.json({ error: "Invalid package" }, { status: 400 });
        }
        if (err.message === "USER_NOT_FOUND") {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.error("[Checkout] Unexpected error:", err.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
