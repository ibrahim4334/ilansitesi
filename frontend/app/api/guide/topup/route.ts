
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
    return NextResponse.json({ error: "Deprecated URL. Please use Stripe Checkout." }, { status: 410 });
}

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const database = db.read();
    const user = database.users.find((u: any) => u.email === session.user.email);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const profile = database.guideProfiles.find(p => p.userId === user.id);
    // If no profile, 0 credits
    return NextResponse.json({ credits: profile?.credits || 0 });
}
