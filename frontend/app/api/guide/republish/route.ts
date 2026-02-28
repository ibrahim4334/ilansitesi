import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSupply } from "@/lib/api-guards";
import { getRoleConfig } from "@/lib/role-config";
import { PackageSystem, TOKEN_COSTS } from "@/lib/package-system";
import { spendToken } from "@/src/modules/tokens/application/spend-token.usecase";
import { safeErrorMessage } from "@/lib/safe-error";

/**
 * POST /api/guide/republish
 * Republish an expired listing. Costs REPUBLISH tokens. Resets expiresAt.
 *
 * Body: { listingId: string }
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireSupply(session);
        if (guard) return guard;

        const roleConfig = getRoleConfig(session!.user.role);
        if (!roleConfig.canRepublish) {
            return NextResponse.json({ error: "Upgrade required to republish" }, { status: 403 });
        }

        const { listingId } = await req.json();
        if (!listingId) {
            return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
        }

        // Resolve user
        const user = await prisma.user.findUnique({
            where: { email: session!.user.email! },
            select: { id: true, packageType: true },
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Verify listing exists, belongs to user, and is EXPIRED
        const listing = await prisma.guideListing.findUnique({
            where: { id: listingId },
        });
        if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        if (listing.guideId !== user.id) {
            return NextResponse.json({ error: "Not your listing" }, { status: 403 });
        }
        if (listing.approvalStatus === "REJECTED") {
            return NextResponse.json({ error: "Listing is rejected" }, { status: 400 });
        }

        // Check active listing count (republishing = reactivating)
        const activeCount = await prisma.guideListing.count({
            where: { guideId: user.id, active: true },
        });
        if (!PackageSystem.canCreateListing(user.packageType, activeCount)) {
            return NextResponse.json({
                error: "Active listing limit reached",
                limit: PackageSystem.getLimits(user.packageType).maxListings,
            }, { status: 403 });
        }

        const spendResult = await spendToken({
            userId: user.id,
            action: "REPUBLISH",
            relatedId: listingId,
            reason: `Republish listing: ${listing.title}`,
        });

        if (!spendResult.ok) {
            if (spendResult.error === "INSUFFICIENT_TOKENS") {
                return NextResponse.json({
                    error: "INSUFFICIENT_CREDITS",
                    message: "Yetersiz Token",
                    cost: spendResult.cost,
                }, { status: 402 });
            }
            return NextResponse.json({ error: spendResult.error }, { status: 400 });
        }

        // ─── Reactivate listing (post-spend) ───
        const newDuration = PackageSystem.getListingDuration(user.packageType);
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + newDuration);

        await prisma.guideListing.update({
            where: { id: listingId },
            data: {
                active: true,
                expiresAt: newExpiresAt,
            },
        });

        console.log(`[Republish] Listing ${listingId} republished. Cost: ${spendResult.cost}, Balance: ${spendResult.newBalance}`);

        return NextResponse.json({
            success: true,
            message: "İlan yeniden yayınlandı",
            expiresAt: newExpiresAt.toISOString(),
            tokenBalance: spendResult.newBalance,
        }, { status: 200 });

    } catch (error) {
        console.error("Republish error:", error);
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
    }
}
