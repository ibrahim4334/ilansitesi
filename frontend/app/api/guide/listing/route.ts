import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSupply } from "@/lib/api-guards";

/**
 * DELETE /api/guide/listing — Soft-delete a guide's own listing
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

        // Find listing and verify ownership
        const listing = await prisma.guideListing.findUnique({
            where: { id: listingId }
        });

        if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        if (listing.guideId !== user.id) {
            return NextResponse.json({ error: "Not your listing" }, { status: 403 });
        }

        // Soft-delete
        await prisma.guideListing.update({
            where: { id: listingId },
            data: {
                active: false,
                deletedAt: new Date()
            }
        });

        return NextResponse.json({ success: true, message: `Listing ${listingId} deleted` });

    } catch (error) {
        console.error("Guide listing delete error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
