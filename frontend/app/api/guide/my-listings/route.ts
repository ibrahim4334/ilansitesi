
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSupply } from "@/lib/api-guards";

export async function GET(req: Request) {
    try {
        const session = await auth();
        const guard = requireSupply(session);
        if (guard) return guard;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const listings = await prisma.guideListing.findMany({
            where: { guideId: user.id },
            include: { tourDays: { orderBy: { day: 'asc' } } },
            orderBy: { createdAt: 'desc' }
        });

        // Format to match old API shape
        const formattedListings = listings.map(l => ({
            ...l,
            pricing: {
                double: l.pricingDouble,
                triple: l.pricingTriple,
                quad: l.pricingQuad,
                currency: l.pricingCurrency
            },
            tourPlan: l.tourDays.map(d => ({
                day: d.day,
                city: d.city,
                title: d.title,
                description: d.description
            })),
            startDate: l.startDate.toISOString().split('T')[0],
            endDate: l.endDate.toISOString().split('T')[0],
            createdAt: l.createdAt.toISOString()
        }));

        return NextResponse.json(formattedListings);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
