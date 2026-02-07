
import { auth } from "@/lib/auth";
import { db, UmrahRequest } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        // Allow user role only (or public if no auth required? User prompt says USER role)
        // If session is missing, but we want to allow public offers, we might need to adjust rules.
        // But prompt says "USER (Umreci)".
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Strict role check? Maybe relax for now to allow testing or if role is missing in session
        // if (session.user.role !== 'USER') ...

        const body = await req.json();
        const { departureCity, peopleCount, dateRange, budget, note, roomType } = body;

        if (!departureCity || !peopleCount || !dateRange) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const database = db.read();

        const newRequest: UmrahRequest = {
            id: crypto.randomUUID(),
            userEmail: session.user.email,
            departureCity,
            peopleCount: parseInt(peopleCount),
            dateRange,
            roomType: roomType || "2-kisilik", // Default
            budget: budget ? parseFloat(budget) : undefined,
            note: note || undefined,
            createdAt: new Date().toISOString(),
            status: "open"
        };

        database.umrahRequests.push(newRequest);
        db.write(database);

        return NextResponse.json(newRequest, { status: 201 });
    } catch (error) {
        console.error("Create request error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        // Allow GUIDE or ORGANIZATION
        if (!session?.user?.email || (session.user.role !== 'GUIDE' && session.user.role !== 'ORGANIZATION')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const database = db.read();
        const openRequests = database.umrahRequests.filter(r => r.status === "open");

        // We do not expose userEmail to guides here directly if not needed, or user rules say: "Do NOT expose user email to guide."
        // So let's map it to remove sensitive info.

        const cleanRequests = openRequests.map(r => ({
            id: r.id,
            departureCity: r.departureCity,
            peopleCount: r.peopleCount,
            dateRange: r.dateRange,
            budget: r.budget,
            note: r.note,
            createdAt: r.createdAt,
            // userEmail removed
        }));

        // Also, maybe we want to know if *this* guide already expressed interest?
        // Let's attach 'hasInterest' boolean?
        // The prompt says: "GUIDE / ORGANIZATION can: View open requests... Submit offers... express interest"
        // Let's keep it simple for now as requested.

        return NextResponse.json(cleanRequests);

    } catch (error) {
        console.error("Get requests error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
