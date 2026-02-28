import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateProfileCompleteness } from "@/lib/listing-ranking";
import { grantToken } from "@/src/modules/tokens/application/grant-token.usecase";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // ─── Deterministic idempotency key for onboarding ───
        const idempotencyKey = `onboarding:${userId}`;

        // Check if already claimed (quick read from unified ledger)
        const alreadyReceived = await prisma.tokenTransaction.findUnique({
            where: { idempotencyKey },
            select: { id: true },
        });

        if (alreadyReceived) {
            return NextResponse.json({ error: "Onboarding tokens already claimed." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        if (user.role !== "GUIDE" && user.role !== "CORPORATE") {
            return NextResponse.json({ error: "Only guides and corporates can claim these tokens." }, { status: 400 });
        }

        // Calculate completeness
        const completeness = calculateProfileCompleteness(user);
        if (completeness < 70) {
            return NextResponse.json({
                error: "Lütfen önce profilinizi %70 oranında doldurunuz.",
                completeness
            }, { status: 403 });
        }

        // Must have a phone number for 2FA/contact
        if (!user.phone?.trim()) {
            return NextResponse.json({
                error: "Hoşgeldin tokenlarını almak için telefon numaranızın kayıtlı olması zorunludur."
            }, { status: 403 });
        }

        // Grant 20 Tokens via unified ledger (atomic + idempotent)
        const result = await grantToken({
            userId,
            amount: 20,
            type: "ADMIN_GRANT",
            reason: "Initial signup credits (Profile completed)",
            idempotencyKey,
        });

        if (result.alreadyProcessed) {
            return NextResponse.json({ error: "Onboarding tokens already claimed." }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: "Hoşgeldin tokenları hesabınıza yüklendi!" });

    } catch (error: any) {
        // P2002 = parallel race on idempotencyKey — already claimed
        if (error.code === "P2002") {
            return NextResponse.json({ error: "Onboarding tokens already claimed." }, { status: 400 });
        }
        console.error("[POST /api/onboarding/claim-tokens] Error:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
