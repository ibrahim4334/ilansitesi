
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email || (session.user.role !== 'GUIDE' && session.user.role !== 'ORGANIZATION')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { listingId } = await req.json();
        if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

        const database = db.read();

        // Find user
        const user = database.users.find((u: any) => u.email === session.user.email);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Find profile to check credits
        const profile = database.guideProfiles.find(p => p.userId === user.id);
        if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        // Initialize credits if undefined
        if (profile.credits === undefined) profile.credits = 0;

        // Cost is 5 credits
        const cost = 5;
        if (profile.credits < cost) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
        }

        // Find listing and verify ownership
        const listing = database.guideListings.find(l => l.id === listingId);
        if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

        if (listing.guideId !== user.id) {
            return NextResponse.json({ error: "Unauthorized access to listing" }, { status: 403 });
        }

        if (listing.isFeatured) {
            return NextResponse.json({ message: "Listing is already featured" }, { status: 200 });
        }

        // Deduct credits and mark featured
        profile.credits -= cost;
        listing.isFeatured = true;

        db.write(database);

        return NextResponse.json({ message: "Listing featured successfully", credits: profile.credits }, { status: 200 });

    } catch (error) {
        console.error("Feature listing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
