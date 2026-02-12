
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { requireAuth } from '@/lib/api-guards';

export async function GET() {
    const session = await auth();
    const authErr = requireAuth(session);
    if (authErr) return authErr;

    // Find interests by this guide, include the related request
    const interests = await prisma.requestInterest.findMany({
        where: { guideEmail: session.user.email },
        include: {
            request: true
        },
        orderBy: { createdAt: 'desc' }
    });

    // Map to the expected response shape
    const offers = interests
        .filter(i => i.request)
        .map(i => ({
            ...i.request,
            createdAt: i.request.createdAt.toISOString(),
            interestDate: i.createdAt.toISOString()
        }));

    return NextResponse.json({ offers });
}
