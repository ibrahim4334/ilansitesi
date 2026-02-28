import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-guards";
import { resolveTicket } from "@/src/modules/fraud/application/escalation.service";
import { safeErrorMessage } from "@/lib/safe-error";

/**
 * GET /api/admin/fraud
 * List fraud review tickets with optional filters.
 * Admin only.
 *
 * Query params:
 *   status: "OPEN" | "IN_REVIEW" | "RESOLVED" (default: "OPEN")
 *   page: number (default: 1)
 *   limit: number (default: 20)
 */
export async function GET(req: Request) {
    const session = await auth();
    const guard = requireAuth(session);
    if (guard) return guard;

    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }

    try {
        const url = new URL(req.url);
        const status = url.searchParams.get("status") || "OPEN";
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");

        const [tickets, total] = await Promise.all([
            prisma.fraudReviewTicket.findMany({
                where: { status },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.fraudReviewTicket.count({ where: { status } }),
        ]);

        // Fetch user info for each ticket
        const userIds = [...new Set(tickets.map(t => t.userId))];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true, name: true, role: true },
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        const enriched = tickets.map(t => ({
            ...t,
            user: userMap.get(t.userId) || null,
        }));

        return NextResponse.json({
            tickets: enriched,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });

    } catch (error) {
        console.error("Fraud queue error:", error);
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
    }
}

/**
 * POST /api/admin/fraud
 * Resolve a fraud review ticket.
 * Admin only.
 *
 * Body: { ticketId: string, resolution: "FALSE_POSITIVE" | "CONFIRMED" | "MONITORING" }
 */
export async function POST(req: Request) {
    const session = await auth();
    const guard = requireAuth(session);
    if (guard) return guard;

    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }

    try {
        const { ticketId, resolution } = await req.json();

        if (!ticketId || !resolution) {
            return NextResponse.json({ error: "Missing ticketId or resolution" }, { status: 400 });
        }

        if (!["FALSE_POSITIVE", "CONFIRMED", "MONITORING"].includes(resolution)) {
            return NextResponse.json({ error: "Invalid resolution" }, { status: 400 });
        }

        // Find admin user
        const admin = await prisma.user.findUnique({
            where: { email: session!.user.email! },
            select: { id: true },
        });
        if (!admin) {
            return NextResponse.json({ error: "Admin not found" }, { status: 404 });
        }

        await resolveTicket(ticketId, resolution, admin.id);

        return NextResponse.json({ success: true, resolution });

    } catch (error) {
        console.error("Fraud resolve error:", error);
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
    }
}
