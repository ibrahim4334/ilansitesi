import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";
import { logAdminAction } from "@/lib/admin-audit";

/**
 * APPROVE-ONLY endpoint.
 * Reject logic is handled exclusively by /api/admin/reject-listing.
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const { listingId, reason } = await req.json();

        if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
        if (!reason) return NextResponse.json({ error: "Missing reason" }, { status: 400 });

        const listing = await prisma.guideListing.findUnique({
            where: { id: listingId }
        });

        if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

        const adminUser = await prisma.user.findUnique({
            where: { email: session!.user.email! }
        });
        if (!adminUser) return NextResponse.json({ error: "Admin user not found" }, { status: 404 });

        // APPROVE only with race-condition block
        const updateResult = await prisma.guideListing.updateMany({
            where: { id: listingId, approvalStatus: 'PENDING' },
            data: {
                approvalStatus: 'APPROVED',
                active: true
            }
        });

        if (updateResult.count === 0) {
            return NextResponse.json({ error: "Listing is not pending or already approved." }, { status: 409 });
        }

        // Write audit log
        await logAdminAction(
            adminUser.id,
            "approve_listing",
            listingId,
            reason,
            { previousStatus: listing.approvalStatus }
        );

        console.log(`[EMAIL] To Guide: "İlanınız onaylandı." Link: /listings/${listing.id}`);

        return NextResponse.json({ success: true, status: 'APPROVED' });

    } catch (error) {
        console.error("Admin approve error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
