
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { requireAuth } from '@/lib/api-guards';

export async function GET() {
    const session = await auth();
    const authErr = requireAuth(session);
    if (authErr) return authErr;

    const userRequests = await prisma.umrahRequest.findMany({
        where: { userEmail: session.user.email },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
        requests: userRequests.map(r => ({
            ...r,
            createdAt: r.createdAt.toISOString()
        }))
    });
}
