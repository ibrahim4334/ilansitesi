
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // Although prompt says USER can view/join, technically Guide could too? 
        // Prompt: "USER users: Can click 'Katıl'."
        if (session.user.role !== 'USER') return NextResponse.json({ error: "Only USER can join" }, { status: 403 });

        const body = await req.json();
        const { listingId } = body;

        if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

        const database = db.read();

        // Find listing
        const listing = database.guideListings.find(l => l.id === listingId);
        if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

        // Find Guide Profile
        const guideProfile = database.guideProfiles.find(p => p.userId === listing.guideId);
        if (!guideProfile) return NextResponse.json({ error: "Guide profile error" }, { status: 500 });

        // Find User
        const userIndex = database.users.findIndex((u: any) => u.email === session.user.email);
        if (userIndex === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const user = database.users[userIndex];

        // MVP Logic:
        // 1. Increment listing.filled
        listing.filled += 1;

        // 2. Increment guide.currentCount
        guideProfile.currentCount += 1;

        // 3. Set user.guideId
        // Assuming we update the user object in db
        database.users[userIndex] = {
            ...user,
            guideId: listing.guideId
        };

        db.write(database);

        return NextResponse.json({ success: true, listing, guide: guideProfile });

    } catch (error) {
        console.error("Join listing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
