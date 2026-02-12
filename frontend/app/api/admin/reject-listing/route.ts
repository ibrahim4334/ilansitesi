import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";
import { logAdminAction } from "@/lib/admin-audit";

export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const { listingId, reason } = await req.json();

        if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
        if (!reason || !reason.trim()) return NextResponse.json({ error: "Reason is mandatory" }, { status: 400 });

        const listing = await prisma.guideListing.findUnique({
            where: { id: listingId }
        });

        if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

        const adminUser = await prisma.user.findUnique({
            where: { email: session!.user.email! }
        });
        if (!adminUser) return NextResponse.json({ error: "Admin user not found" }, { status: 404 });

        await prisma.guideListing.update({
            where: { id: listingId },
            data: {
                approvalStatus: "REJECTED",
                rejectionReason: reason.trim(),
                active: false
            }
        });

        // Auto-refund if listing was featured (credits were spent)
        if (listing.isFeatured) {
            const { TokenService } = await import("@/lib/token-service");
            await TokenService.grantCredits(
                listing.guideId,
                TokenService.COST_FEATURE,
                "refund",
                `Auto-refund: featured listing ${listingId} rejected`,
                listingId
            );

            await prisma.guideListing.update({
                where: { id: listingId },
                data: { isFeatured: false }
            });
        }

        // Write audit log
        await logAdminAction(
            adminUser.id,
            "reject_listing",
            listingId,
            reason,
            { previousStatus: listing.approvalStatus }
        );

        return NextResponse.json({ success: true, status: "REJECTED" });

    } catch (error) {
        console.error("Admin reject-listing error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
