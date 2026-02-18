
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-guards";

export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireRole(session, 'USER');
        if (guard) return guard;

        const body = await req.json();
        const { listingId } = body;

        if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

        const listing = await prisma.guideListing.findUnique({
            where: { id: listingId },
            include: { guide: true }
        });

        if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        if (!listing.guide) return NextResponse.json({ error: "Guide profile error" }, { status: 500 });

        // Increment listing.filled and guide.currentCount atomically
        const [updatedListing, updatedProfile] = await prisma.$transaction([
            prisma.guideListing.update({
                where: { id: listingId },
                data: { filled: { increment: 1 } }
            }),
            prisma.guideProfile.update({
                where: { userId: listing.guideId },
                data: { currentCount: { increment: 1 } }
            })
        ]);

        return NextResponse.json({ success: true, listing: updatedListing, guide: updatedProfile });

    } catch (error) {
        console.error("Join listing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
