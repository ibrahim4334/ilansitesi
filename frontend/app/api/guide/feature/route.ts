import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSupply } from "@/lib/api-guards";
import { TokenService } from "@/lib/token-service";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireSupply(session);
        if (guard) return guard;

        const { listingId } = await req.json();
        if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

        // Rate limit: 3 feature requests per minute
        const rl = rateLimit(`feature:${session!.user.email}`, 60_000, 3);
        if (!rl.success) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session!.user.email! }
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // ─── Feature Cap: Max 3 featured listings per GUIDE/ORG ───
        const featuredCount = await prisma.guideListing.count({
            where: {
                guideId: user.id,
                isFeatured: true,
                active: true
            }
        });

        if (featuredCount >= TokenService.MAX_FEATURED_LISTINGS) {
            return NextResponse.json({
                error: "FEATURE_CAP_REACHED",
                message: `En fazla ${TokenService.MAX_FEATURED_LISTINGS} ilan öne çıkarılabilir.`
            }, { status: 400 });
        }

        // Find listing and verify ownership + eligibility
        const listing = await prisma.guideListing.findUnique({
            where: { id: listingId }
        });
        if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        if (listing.guideId !== user.id) {
            return NextResponse.json({ error: "Unauthorized access to listing" }, { status: 403 });
        }
        if (listing.isFeatured) {
            return NextResponse.json({ message: "Listing is already featured" }, { status: 200 });
        }
        if (listing.approvalStatus !== 'APPROVED') {
            return NextResponse.json({ error: "Only approved listings can be featured" }, { status: 400 });
        }

        // ─── Atomic: deduct credits AND set isFeatured in single transaction ───
        const cost = TokenService.COST_FEATURE;
        const idempotencyKey = `feature:${user.id}:${listingId}`;
        try {
            const newBalance = await prisma.$transaction(async (tx) => {
                // (1) Idempotency check — if already processed, return cached balance
                const existingLedger = await tx.creditTransaction.findUnique({
                    where: { idempotencyKey }
                });
                if (existingLedger) {
                    const bal = await tx.creditTransaction.aggregate({
                        where: { userId: user.id },
                        _sum: { amount: true }
                    });
                    return bal._sum.amount || 0;
                }

                // (2) Row-level lock to prevent concurrent double-spend
                const [balanceRow] = await tx.$queryRaw<[{ balance: number }]>`
                    SELECT COALESCE(SUM(amount), 0) AS balance
                    FROM credit_transactions
                    WHERE userId = ${user.id}
                    FOR UPDATE
                `;
                const currentBalance = Number(balanceRow.balance);

                // (3) Strict non-negative guard
                if (currentBalance - cost < 0) {
                    throw new Error('INSUFFICIENT_CREDITS');
                }

                // (4) Write deduction to ledger
                await tx.creditTransaction.create({
                    data: {
                        userId: user.id,
                        amount: -cost,
                        type: "spend",
                        reason: `Feature listing: ${listing.title}`,
                        relatedId: listingId,
                        idempotencyKey,
                    }
                });

                // (5) Update GuideProfile cache
                const updated = await tx.guideProfile.update({
                    where: { userId: user.id },
                    data: { credits: { decrement: cost } }
                });

                // (6) Feature the listing inside the same transaction
                await tx.guideListing.update({
                    where: { id: listingId },
                    data: { isFeatured: true }
                });

                return Math.max(0, updated.credits);
            }, {
                isolationLevel: 'Serializable',
                timeout: 10000,
            });

            return NextResponse.json({
                message: "Listing featured successfully",
                credits: newBalance
            }, { status: 200 });

        } catch (error: any) {
            if (error.message === 'INSUFFICIENT_CREDITS') {
                const balance = await TokenService.getBalance(user.id);
                return NextResponse.json({
                    error: "INSUFFICIENT_CREDITS",
                    message: "Yetersiz Kredi",
                    balance
                }, { status: 402 });
            }
            throw error;
        }

    } catch (error) {
        console.error("Feature listing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE — De-feature a listing (no refund, just toggle off)
 */
export async function DELETE(req: Request) {
    try {
        const session = await auth();
        const guard = requireSupply(session);
        if (guard) return guard;

        const { listingId } = await req.json();
        if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

        const user = await prisma.user.findUnique({
            where: { email: session!.user.email! }
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const listing = await prisma.guideListing.findUnique({
            where: { id: listingId }
        });
        if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        if (listing.guideId !== user.id) {
            return NextResponse.json({ error: "Not your listing" }, { status: 403 });
        }

        if (!listing.isFeatured) {
            return NextResponse.json({ message: "Listing is not featured" }, { status: 200 });
        }

        await prisma.guideListing.update({
            where: { id: listingId },
            data: { isFeatured: false }
        });

        return NextResponse.json({
            success: true,
            message: "Listing de-featured"
        });

    } catch (error) {
        console.error("De-feature listing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
