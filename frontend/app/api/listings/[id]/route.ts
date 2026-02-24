import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const listing = await prisma.guideListing.findUnique({
            where: { id },
            include: { tourDays: { orderBy: { day: 'asc' } } }
        });

        if (!listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        return NextResponse.json(listing);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const body = await req.json();

        // Check ownership
        const listing = await prisma.guideListing.findUnique({
            where: { id },
            select: { guideId: true }
        });

        if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Allow Owner OR Admin
        if (listing.guideId !== session.user.id && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // ── SECURITY: Explicit field whitelist — never pass raw body to Prisma ──
        // Fields like approvalStatus, guideId, isFeatured, legalConsent are NOT updatable here.
        // approvalStatus → /api/admin/approve-listing or /api/admin/reject-listing (ADMIN only)
        // isFeatured     → /api/guide/feature (credit-gated)
        // guideId        → immutable after creation
        const safeData: Record<string, unknown> = {};
        if (body.title !== undefined) safeData.title = String(body.title).trim();
        if (body.description !== undefined) safeData.description = String(body.description);
        if (body.city !== undefined) safeData.city = String(body.city);
        if (body.meetingCity !== undefined) safeData.meetingCity = body.meetingCity;
        if (body.hotelName !== undefined) safeData.hotelName = body.hotelName;
        if (body.extraServices !== undefined) safeData.extraServices = Array.isArray(body.extraServices) ? body.extraServices : [];
        if (body.departureCityId !== undefined) safeData.departureCityId = String(body.departureCityId);
        if (body.airlineId !== undefined) safeData.airlineId = body.airlineId;
        if (body.pricingDouble !== undefined) safeData.pricingDouble = Number(body.pricingDouble);
        if (body.pricingTriple !== undefined) safeData.pricingTriple = Number(body.pricingTriple);
        if (body.pricingQuad !== undefined) safeData.pricingQuad = Number(body.pricingQuad);
        if (body.pricingCurrency !== undefined) safeData.pricingCurrency = String(body.pricingCurrency);
        if (body.quota !== undefined) safeData.quota = Math.min(500, Math.max(1, parseInt(body.quota)));
        if (body.totalDays !== undefined) safeData.totalDays = Math.min(60, Math.max(1, parseInt(body.totalDays)));
        if (body.startDate !== undefined) safeData.startDate = new Date(body.startDate);
        if (body.endDate !== undefined) safeData.endDate = new Date(body.endDate);
        if (body.urgencyTag !== undefined) safeData.urgencyTag = body.urgencyTag;
        // Guide can deactivate their own listing
        if (body.active === false && session.user.role !== 'ADMIN') safeData.active = false;
        // Admin can set active freely
        if (session.user.role === 'ADMIN' && body.active !== undefined) safeData.active = Boolean(body.active);

        if (Object.keys(safeData).length === 0) {
            return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
        }

        const updated = await prisma.guideListing.update({
            where: { id },
            data: safeData
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;

        // Check ownership
        const listing = await prisma.guideListing.findUnique({
            where: { id },
            select: { guideId: true }
        });

        if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (listing.guideId !== session.user.id && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.guideListing.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
