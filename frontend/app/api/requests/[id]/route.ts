
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * GET /api/requests/[id]
 * Returns request details with PII protection:
 * - userEmail NEVER returned
 * - contactInfo ONLY visible to: ADMIN, the request owner, or a guide who PAID interest
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // BANNED check
    if (session.user.role === 'BANNED') {
        return NextResponse.json({ error: "Account banned" }, { status: 403 });
    }

    const { id } = params;

    const request = await prisma.umrahRequest.findUnique({
        where: { id },
        select: {
            id: true,
            departureCity: true,
            peopleCount: true,
            dateRange: true,
            roomType: true,
            budget: true,
            note: true,
            status: true,
            createdAt: true,
            userEmail: true, // Needed for ownership check, NOT returned
        }
    });

    if (!request) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = session.user.email === request.userEmail;
    const isAdmin = session.user.role === 'ADMIN';

    // Check if this guide/org has paid interest on this request
    let hasPaidInterest = false;
    if (session.user.role === 'GUIDE' || session.user.role === 'ORGANIZATION') {
        const interest = await prisma.requestInterest.findUnique({
            where: {
                requestId_guideEmail: {
                    requestId: id,
                    guideEmail: session.user.email!
                }
            }
        });
        hasPaidInterest = !!interest;
    }

    // Build safe response — NEVER include userEmail
    const safeResponse: Record<string, any> = {
        id: request.id,
        departureCity: request.departureCity,
        peopleCount: request.peopleCount,
        dateRange: request.dateRange,
        roomType: request.roomType,
        budget: request.budget,
        note: request.note,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
    };

    // Contact info ONLY for: owner, admin, or guide who paid interest
    if (isOwner || isAdmin || hasPaidInterest) {
        const requestUser = await prisma.user.findUnique({
            where: { email: request.userEmail },
            select: { email: true, phone: true, contactConsent: true }
        });

        if (requestUser) {
            safeResponse.contactConsent = requestUser.contactConsent;
            if (isOwner || isAdmin || requestUser.contactConsent) {
                safeResponse.contactInfo = {
                    email: requestUser.email,
                    phone: requestUser.phone
                };
            }
        }
    }

    return NextResponse.json(safeResponse);
}
