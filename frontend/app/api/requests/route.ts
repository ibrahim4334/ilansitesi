
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRole, requireSupply } from "@/lib/api-guards";

export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireRole(session, 'USER');
        if (guard) return guard;

        const body = await req.json();
        const { departureCity, peopleCount, dateRange, budget, note, roomType } = body;

        if (!departureCity || !peopleCount || !dateRange) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check request limit (Max 3)
        const existingCount = await prisma.umrahRequest.count({
            where: {
                userEmail: session.user.email,
                status: 'open'
            }
        });

        if (existingCount >= 3) {
            return NextResponse.json({
                error: "Limit Reached",
                message: "En fazla 3 adet aktif talep oluşturabilirsiniz."
            }, { status: 403 });
        }

        const newRequest = await prisma.umrahRequest.create({
            data: {
                userEmail: session.user.email,
                departureCity,
                peopleCount: parseInt(peopleCount),
                dateRange,
                roomType: roomType || "2-kisilik",
                budget: budget ? parseFloat(budget) : null,
                note: note || null,
                status: "open"
            }
        });

        return NextResponse.json({
            ...newRequest,
            createdAt: newRequest.createdAt.toISOString()
        }, { status: 201 });
    } catch (error) {
        console.error("Create request error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email || (session.user.role !== 'GUIDE' && session.user.role !== 'ORGANIZATION')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const openRequests = await prisma.umrahRequest.findMany({
            where: { status: "open" },
            orderBy: { createdAt: 'desc' }
        });

        // Remove sensitive info (userEmail)
        const cleanRequests = openRequests.map(r => ({
            id: r.id,
            departureCity: r.departureCity,
            peopleCount: r.peopleCount,
            dateRange: r.dateRange,
            roomType: r.roomType,
            budget: r.budget,
            note: r.note,
            createdAt: r.createdAt.toISOString(),
        }));

        return NextResponse.json(cleanRequests);

    } catch (error) {
        console.error("Get requests error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
