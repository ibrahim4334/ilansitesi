
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const database = db.read();
        const user = database.users.find((u: any) => u.email === session.user.email);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        let profile = database.guideProfiles.find(p => p.userId === user.id);

        if (!profile) {
            // Return default placeholder
            profile = {
                userId: user.id,
                fullName: session.user.name || "",
                phone: "",
                city: "",
                bio: "",
                photo: "",
                isDiyanet: false,
                quotaTarget: 30,
                currentCount: 0,
                isApproved: false
            };
        }

        return NextResponse.json(profile);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (session.user.role !== 'GUIDE') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();

        const database = db.read();
        const user = database.users.find((u: any) => u.email === session.user.email);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        let profileIndex = database.guideProfiles.findIndex(p => p.userId === user.id);

        if (profileIndex === -1) {
            // Create
            database.guideProfiles.push({
                userId: user.id,
                fullName: body.fullName || session.user.name,
                phone: body.phone || "",
                city: body.city || "",
                bio: body.bio || "",
                photo: body.photo || "",
                isDiyanet: body.isDiyanet || false,
                quotaTarget: 30,
                currentCount: 0,
                isApproved: false
            });
        } else {
            // Update
            const existing = database.guideProfiles[profileIndex];
            database.guideProfiles[profileIndex] = {
                ...existing,
                fullName: body.fullName || existing.fullName,
                phone: body.phone || existing.phone,
                city: body.city || existing.city,
                bio: body.bio || existing.bio,
                photo: body.photo || existing.photo,
                isDiyanet: typeof body.isDiyanet === 'boolean' ? body.isDiyanet : existing.isDiyanet
            };
        }

        db.write(database);
        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
