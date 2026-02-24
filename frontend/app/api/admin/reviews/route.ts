import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        // Only ADMIN should access this
        const session = await getServerSession(authOptions);
        if (!session || !session.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get pending reviews
        const pendingReviews = await prisma.review.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            include: {
                reviewer: { select: { id: true, name: true, email: true } },
                guide: { select: { id: true, name: true, email: true } },
                request: { select: { id: true, departureCity: true } }
            }
        });

        return NextResponse.json({ success: true, data: pendingReviews });
    } catch (error: any) {
        console.error("[GET /api/admin/reviews] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
