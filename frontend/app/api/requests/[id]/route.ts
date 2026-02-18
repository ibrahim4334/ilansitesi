
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/api-guards';

/**
 * GET /api/requests/[id]
 * Returns request details with PII protection:
 * - userEmail NEVER returned
 * - contactInfo ONLY visible to: ADMIN, the request owner, or a guide who PAID interest
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // BANNED check
    if (session.user.role === 'BANNED') {
        return NextResponse.json({ error: "Account banned" }, { status: 403 });
    }

    const { id } = await params;

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
            contactViaEmail: true,
            contactViaPhone: true,
            contactViaChat: true,
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
        // Publicly visible preferences (so guides know what they get if they pay)
        contactPreferences: {
            email: request.contactViaEmail,
            phone: request.contactViaPhone,
            chat: request.contactViaChat
        },
        hasPaidInterest, // Let frontend know if they have access
        isOwner, // Let frontend know if they own this request
    };

    // Contact info ONLY for: owner, admin, or guide who paid interest
    if (isOwner || isAdmin || hasPaidInterest) {
        const requestUser = await prisma.user.findUnique({
            where: { email: request.userEmail },
            select: { email: true, phone: true }
        });

        if (requestUser) {
            safeResponse.contactInfo = {};

            // Reveal based on preferences OR if viewer is owner/admin
            if (isOwner || isAdmin || request.contactViaEmail) {
                safeResponse.contactInfo.email = requestUser.email;
            }
            if (isOwner || isAdmin || request.contactViaPhone) {
                safeResponse.contactInfo.phone = requestUser.phone;
            }
            // Chat capability is implicitly allowed if contactViaChat is true
            safeResponse.canChat = request.contactViaChat;
        }
    }

    return NextResponse.json(safeResponse);
}

/**
 * PUT /api/requests/[id] — Edit own request (full update)
 * Only owner or ADMIN, only open requests
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (session.user.role === 'BANNED') {
            return NextResponse.json({ error: "Account banned" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();

        // 1. Check ownership
        const request = await prisma.umrahRequest.findUnique({
            where: { id },
            select: { userEmail: true, status: true }
        });

        if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (request.userEmail !== session.user.email && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Block editing closed/deleted requests (unless admin)
        if (request.status !== 'open' && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Sadece aktif talepler düzenlenebilir" }, { status: 400 });
        }

        // 3. Update — never allow status change through PUT
        const updated = await prisma.umrahRequest.update({
            where: { id },
            data: {
                departureCity: body.departureCity,
                peopleCount: body.peopleCount ? parseInt(body.peopleCount.toString()) : undefined,
                dateRange: body.dateRange,
                roomType: body.roomType,
                budget: body.budget ? parseFloat(body.budget.toString()) : null,
                note: body.note,
                contactViaEmail: body.contactViaEmail,
                contactViaPhone: body.contactViaPhone,
                contactViaChat: body.contactViaChat,
            }
        });

        return NextResponse.json({ message: "Updated", request: updated });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

/**
 * PATCH /api/requests/[id] — Partial update or close
 * Supports: { status: "closed" } to close own request
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        const guard = requireRole(session, 'USER', 'ADMIN');
        if (guard) return guard;

        const { id } = await params;
        const body = await req.json();

        const request = await prisma.umrahRequest.findUnique({
            where: { id },
            select: { userEmail: true, status: true }
        });

        if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (request.userEmail !== session!.user.email && session!.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Build update data — only allow safe fields
        const updateData: any = {};

        // Allow closing
        if (body.status === 'closed') {
            if (request.status !== 'open') {
                return NextResponse.json({ error: "Talep zaten kapalı" }, { status: 400 });
            }
            updateData.status = 'closed';
        }

        // Allow editing fields if request is open
        if (request.status === 'open') {
            if (body.departureCity !== undefined) updateData.departureCity = body.departureCity;
            if (body.peopleCount !== undefined) updateData.peopleCount = parseInt(body.peopleCount.toString());
            if (body.dateRange !== undefined) updateData.dateRange = body.dateRange;
            if (body.roomType !== undefined) updateData.roomType = body.roomType;
            if (body.budget !== undefined) updateData.budget = body.budget ? parseFloat(body.budget.toString()) : null;
            if (body.note !== undefined) updateData.note = body.note;
            if (body.contactViaEmail !== undefined) updateData.contactViaEmail = body.contactViaEmail;
            if (body.contactViaPhone !== undefined) updateData.contactViaPhone = body.contactViaPhone;
            if (body.contactViaChat !== undefined) updateData.contactViaChat = body.contactViaChat;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
        }

        const updated = await prisma.umrahRequest.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ message: "Updated", request: updated });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/requests/[id] — Soft delete own request
 * Owner-only, USER role only
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        const guard = requireRole(session, 'USER', 'ADMIN');
        if (guard) return guard;

        const { id } = await params;

        const request = await prisma.umrahRequest.findUnique({
            where: { id },
            select: { userEmail: true, status: true }
        });

        if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (request.userEmail !== session!.user.email && session!.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (request.status === 'deleted') {
            return NextResponse.json({ error: "Already deleted" }, { status: 400 });
        }

        await prisma.umrahRequest.update({
            where: { id },
            data: { status: 'deleted', deletedAt: new Date() }
        });

        return NextResponse.json({ success: true, message: `Request ${id} soft-deleted` });
    } catch (e) {
        console.error("Delete request error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

