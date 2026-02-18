import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const airlines = await prisma.airline.findMany({
            orderBy: [
                { isCharterFriendly: 'desc' },
                { name: 'asc' }
            ]
        });

        return NextResponse.json(airlines);
    } catch (error) {
        console.error("Airlines API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
