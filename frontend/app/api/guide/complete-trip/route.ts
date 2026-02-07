
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email || (session.user.role !== 'GUIDE' && session.user.role !== 'ORGANIZATION')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const database = db.read();

        // Find user
        const user = database.users.find((u: any) => u.email === session.user.email);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Find profile
        const profile = database.guideProfiles.find(p => p.userId === user.id);
        if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        // Initialize fields if undefined
        if (profile.trustScore === undefined) profile.trustScore = 50;
        if (profile.completedTrips === undefined) profile.completedTrips = 0;

        // Increment
        profile.trustScore += 1;
        profile.completedTrips += 1;

        db.write(database);

        return NextResponse.json({
            message: "Trip completed recorded",
            trustScore: profile.trustScore,
            completedTrips: profile.completedTrips
        }, { status: 200 });

    } catch (error) {
        console.error("Complete trip error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
