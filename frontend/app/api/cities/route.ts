import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const cities = await prisma.departureCity.findMany({
            orderBy: [
                { priority: 'desc' },
                { name: 'asc' }
            ]
        });

        return NextResponse.json(cities);
    } catch (error) {
        console.error("Cities API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
