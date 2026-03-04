import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";
import { safeErrorMessage } from "@/lib/safe-error";

export async function GET(req: Request) {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const limit = parseInt(searchParams.get("limit") || "50");

        const listings = await prisma.guideListing.findMany({
            where: {
                OR: [
                    { title: { contains: search } },
                    { guide: { fullName: { contains: search } } },
                ]
            },
            include: {
                guide: { select: { fullName: true, user: { select: { email: true } } } },
                departureCity: true
            },
            orderBy: { createdAt: "desc" },
            take: limit
        });

        const formatted = (listings as any[]).map(l => ({
            id: l.id,
            title: l.title,
            guideName: l.guide?.fullName || "Bilinmiyor",
            guideEmail: l.guide?.user?.email || "",
            price: l.price || l.pricingQuad || 0,
            active: l.active,
            approvalStatus: l.approvalStatus,
            quota: l.quota,
            filled: l.filled,
            totalDays: l.totalDays,
            city: l.city,
            departureCity: l.departureCity?.name || l.departureCityOld,
            createdAt: l.createdAt.toISOString()
        }));

        return NextResponse.json({ listings: formatted });
    } catch (error) {
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
    }
}
