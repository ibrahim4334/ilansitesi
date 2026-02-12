
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth, requireSupply } from "@/lib/api-guards";

export async function GET(req: Request) {
    try {
        const session = await auth();
        const authErr = requireAuth(session);
        if (authErr) return authErr;

        const user = await prisma.user.findUnique({
            where: { email: session!.user.email! }
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Get or create profile
        const profile = await prisma.guideProfile.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                fullName: session.user.name || "",
                phone: "",
                city: "",
                bio: "",
                photo: "",
                isDiyanet: false,
                quotaTarget: 30,
                currentCount: 0,
                isApproved: false,
                credits: 0,
                package: "FREEMIUM",
                tokens: 0
            }
        });

        return NextResponse.json(profile);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        const guard = requireSupply(session);
        if (guard) return guard;

        const body = await req.json();

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        await prisma.guideProfile.upsert({
            where: { userId: user.id },
            update: {
                fullName: body.fullName || undefined,
                phone: body.phone || undefined,
                city: body.city || undefined,
                bio: body.bio || undefined,
                photo: body.photo || undefined,
                isDiyanet: typeof body.isDiyanet === 'boolean' ? body.isDiyanet : undefined
            },
            create: {
                userId: user.id,
                fullName: body.fullName || session.user.name || "",
                phone: body.phone || "",
                city: body.city || "",
                bio: body.bio || "",
                photo: body.photo || "",
                isDiyanet: body.isDiyanet || false,
                quotaTarget: 30,
                currentCount: 0,
                isApproved: false,
                credits: 0,
                package: "FREEMIUM",
                tokens: 0
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
