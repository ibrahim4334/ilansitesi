
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/api-guards';

export async function GET() {
    const session = await auth();
    const guard = requireRole(session, 'USER');
    if (guard) return guard;

    const userRequests = await prisma.umrahRequest.findMany({
        where: {
            userEmail: session!.user.email!,
            deletedAt: null, // Exclude soft-deleted
        },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
        requests: userRequests.map(r => ({
            id: r.id,
            departureCity: r.departureCity,
            peopleCount: r.peopleCount,
            dateRange: r.dateRange,
            roomType: r.roomType,
            budget: r.budget,
            note: r.note,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            contactViaEmail: r.contactViaEmail,
            contactViaPhone: r.contactViaPhone,
            contactViaChat: r.contactViaChat,
        }))
    });
}
