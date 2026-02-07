
import { auth } from "@/lib/auth";
import { db, Transaction } from "@/lib/db";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key', {
    apiVersion: '2025-01-27.acacia', // Use latest or what is available
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

        const database = db.read();

        // Find package
        const creditPackage = database.creditPackages?.find(p => p.id === packageId);
        // Fallback if not in DB yet (though it should be seeded)
        if (!creditPackage) {
            return NextResponse.json({ error: "Invalid package" }, { status: 400 });
        }

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
                        unit_amount: creditPackage.priceTRY * 100, // Amount in cents (kurus)
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?success=true`,
            cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?canceled=true`,
            metadata: {
                userId: session.user.id || "", // We might need to fetch user ID from DB if session doesn't have it fully populated, but usually session has it.
                userEmail: session.user.email,
                role: session.user.role,
                credits: creditPackage.credits.toString(),
                packageId: creditPackage.id
            },
        });

        // Save Pending Transaction
        // We really need the user ID from the DB to be safe involving future lookups
        const user = database.users.find((u: any) => u.email === session.user.email);

        const newTransaction: Transaction = {
            id: crypto.randomUUID(),
            userId: user?.id || session.user.id,
            role: session.user.role,
            credits: creditPackage.credits,
            amountTRY: creditPackage.priceTRY,
            provider: "stripe",
            status: "pending",
            sessionId: stripeSession.id,
            createdAt: new Date().toISOString()
        };

        if (!database.transactions) database.transactions = [];
        database.transactions.push(newTransaction);
        db.write(database);

        return NextResponse.json({ url: stripeSession.url });

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
