
import { auth } from "@/lib/auth";
import { db, GuideListing } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    // Public endpoint to fetch listings
    // Optional: ?guideId=... to filter
    try {
        const { searchParams } = new URL(req.url);
        const guideId = searchParams.get('guideId');

        const database = db.read();
        let listings = database.guideListings.filter(l => l.active);

        if (guideId) {
            listings = listings.filter(l => l.guideId === guideId);
        }

        // Enrich with guide profile data
        const enrichedListings = listings.map(l => {
            const profile = database.guideProfiles.find(p => p.userId === l.guideId);
            return {
                ...l,
                guide: profile ? {
                    fullName: profile.fullName,
                    city: profile.city,
                    bio: profile.bio,
                    phone: profile.phone,
                    isDiyanet: profile.isDiyanet,
                    photo: profile.photo
                } : null
            };
        });

        return NextResponse.json(enrichedListings);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (session.user.role !== 'GUIDE') return NextResponse.json({ error: "Forbidden: Guides only" }, { status: 403 });

        const body = await req.json();
        const { title, description, city, quota } = body;

        if (!title || !city) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const database = db.read();

        // Find user id from email provided by session
        // Note: db.json users have 'email'.
        const user = database.users.find((u: any) => u.email === session.user.email);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Ensure Profile Exists
        let profile = database.guideProfiles.find(p => p.userId === user.id);
        if (!profile) {
            // Auto-create profile if missing
            profile = {
                userId: user.id,
                fullName: session.user.name || "Unknown Guide",
                phone: "",
                city: city || "",
                bio: "",
                photo: "",
                isDiyanet: false,
                quotaTarget: 30,
                currentCount: 0,
                isApproved: false // Default false
            };
            database.guideProfiles.push(profile);
        }

        // PROFILE COMPLETENESS CHECK
        if (!profile.phone || !profile.bio) {
            return NextResponse.json({ error: "ProfileIncomplete" }, { status: 400 });
        }

        const newListing: GuideListing = {
            id: crypto.randomUUID(),
            guideId: user.id,
            title,
            description: description || "",
            city,
            quota: quota ? parseInt(quota) : 30,
            filled: 0,
            active: true,
            participants: [] // Initialize empty
        };

        database.guideListings.push(newListing);
        db.write(database);

        return NextResponse.json(newListing);

    } catch (error) {
        console.error("Create listing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
