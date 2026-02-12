import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";
import { logAdminAction } from "@/lib/admin-audit";
import { TokenService } from "@/lib/token-service";

export async function GET() {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const requests = await prisma.umrahRequest.findMany({
            where: { deletedAt: null }, // Soft-delete: only show active
            include: {
                interests: { select: { id: true, guideEmail: true } },
                _count: { select: { interests: true, favorites: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        const result = requests.map((r) => ({
            id: r.id,
            userEmail: r.userEmail,
            departureCity: r.departureCity,
            peopleCount: r.peopleCount,
            dateRange: r.dateRange,
            roomType: r.roomType,
            budget: r.budget,
            note: r.note,
            status: r.status,
            createdAt: r.createdAt,
            interestCount: r._count.interests,
            favoriteCount: r._count.favorites,
        }));

        return NextResponse.json({ requests: result });
    } catch (error) {
        console.error("Admin requests GET error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const { requestId, reason } = await req.json();

        if (!requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });

        const request = await prisma.umrahRequest.findUnique({
            where: { id: requestId },
            include: { interests: true }
        });
        if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

        const adminUser = await prisma.user.findUnique({
            where: { email: session!.user.email! }
        });
        if (!adminUser) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

        // ─── REFUND all interest credits before soft-delete ───
        const refundPromises = [];
        for (const interest of request.interests) {
            // Find the guide's user record
            const guideUser = await prisma.user.findUnique({
                where: { email: interest.guideEmail }
            });
            if (guideUser) {
                // Determine cost: ORG=10, GUIDE=5
                const cost = guideUser.role === 'ORGANIZATION'
                    ? TokenService.COST_ORG_INTEREST
                    : TokenService.COST_GUIDE_INTEREST;

                refundPromises.push(
                    TokenService.grantCredits(
                        guideUser.id,
                        cost,
                        "refund",
                        `Refund: request ${requestId} deleted by admin`,
                        requestId
                    )
                );
            }
        }
        await Promise.all(refundPromises);

        // ─── SOFT-DELETE instead of hard delete ───
        await prisma.umrahRequest.update({
            where: { id: requestId },
            data: {
                status: "deleted",
                deletedAt: new Date()
            }
        });

        // Write audit log
        await logAdminAction(
            adminUser.id,
            "delete_request",
            requestId,
            reason || "Admin soft delete",
            {
                userEmail: request.userEmail,
                departureCity: request.departureCity,
                refundedInterests: request.interests.length
            }
        );

        return NextResponse.json({
            success: true,
            message: `Request ${requestId} soft-deleted, ${request.interests.length} interest(s) refunded`
        });

    } catch (error) {
        console.error("Admin requests DELETE error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
