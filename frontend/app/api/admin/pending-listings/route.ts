import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";

export async function GET() {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const listings = await prisma.guideListing.findMany({
            where: { approvalStatus: "PENDING" },
            include: {
                guide: {
                    include: {
                        user: { select: { name: true, email: true } }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const result = listings.map((l) => ({
            id: l.id,
            title: l.title,
            guideName: l.guide?.user?.name || l.guide?.fullName || "—",
            guideEmail: l.guide?.user?.email || "—",
            price: l.price || l.pricingDouble,
            createdAt: l.createdAt,
            trustScore: l.guide?.trustScore ?? 0,
            isFeatured: l.isFeatured,
            departureCity: l.departureCity,
            city: l.city,
        }));

        return NextResponse.json({ listings: result });
    } catch (error) {
        console.error("Admin pending-listings error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
