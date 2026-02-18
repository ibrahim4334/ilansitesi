
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { requireSupply } from '@/lib/api-guards';

export async function GET() {
    const session = await auth();
    const guard = requireSupply(session);
    if (guard) return guard;

    // Find interests by this guide, include the related request
    const interests = await prisma.requestInterest.findMany({
        where: { guideEmail: session!.user.email! },
        include: {
            request: true
        },
        orderBy: { createdAt: 'desc' }
    });

    // Map to the expected response shape
    const offers = interests
        .filter(i => i.request)
        .map(i => ({
            id: i.request.id,
            departureCity: i.request.departureCity,
            peopleCount: i.request.peopleCount,
            dateRange: i.request.dateRange,
            roomType: i.request.roomType,
            budget: i.request.budget,
            note: i.request.note,
            status: i.request.status,
            createdAt: i.request.createdAt.toISOString(),
            interestDate: i.createdAt.toISOString()
        }));

    return NextResponse.json({ offers });
}
