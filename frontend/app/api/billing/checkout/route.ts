
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key', {
    apiVersion: '2025-01-27.acacia' as any,
    typescript: true,
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email || (session.user.role !== 'GUIDE' && session.user.role !== 'ORGANIZATION')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { packageId } = await req.json();
        if (!packageId) return NextResponse.json({ error: "Missing packageId" }, { status: 400 });

        // Find package
        const creditPackage = await prisma.creditPackage.findUnique({
            where: { id: packageId }
        });
        if (!creditPackage) {
            return NextResponse.json({ error: "Invalid package" }, { status: 400 });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        // Create Stripe Session
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "try",
                        product_data: {
                            name: creditPackage.name,
                            description: `${creditPackage.credits} Kredi`,
                        },
                        unit_amount: creditPackage.priceTRY * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?success=true`,
            cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?canceled=true`,
            metadata: {
                userId: user?.id || "",
                userEmail: session.user.email,
                role: session.user.role,
                credits: creditPackage.credits.toString(),
                packageId: creditPackage.id
            },
        });

        // Save Pending Transaction
        await prisma.transaction.create({
            data: {
                userId: user?.id || "",
                role: session.user.role,
                credits: creditPackage.credits,
                amountTRY: creditPackage.priceTRY,
                provider: "stripe",
                status: "pending",
                sessionId: stripeSession.id,
            }
        });

        return NextResponse.json({ url: stripeSession.url });

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
