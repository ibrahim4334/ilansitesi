import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSupply } from "@/lib/api-guards";
import { TokenService } from "@/lib/token-service";

export async function POST(req: Request) {
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

        // ─── Deduct credits atomically (balance check inside $transaction) ───
        const cost = TokenService.COST_FEATURE;
        const deductResult = await TokenService.deductCredits(
            user.id,
            cost,
            `Feature listing: ${listing.title}`,
            listingId
        );

        if (!deductResult.success) {
            return NextResponse.json({
                error: "INSUFFICIENT_CREDITS",
                message: "Yetersiz Kredi",
                balance: deductResult.newBalance
            }, { status: 402 });
        }

        await prisma.guideListing.update({
            where: { id: listingId },
            data: { isFeatured: true }
        });

        return NextResponse.json({
            message: "Listing featured successfully",
            credits: deductResult.newBalance
        }, { status: 200 });

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
