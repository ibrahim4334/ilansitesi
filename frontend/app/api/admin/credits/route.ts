import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";
import { logAdminAction } from "@/lib/admin-audit";
import { TokenService } from "@/lib/token-service";

export async function GET(req: Request) {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ error: "Missing email parameter" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                guideProfile: { select: { credits: true, fullName: true, package: true } }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const transactions = await prisma.creditTransaction.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        const balance = await TokenService.getBalance(user.id);

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                guideName: user.guideProfile?.fullName,
                package: user.guideProfile?.package,
            },
            balance,
            transactions,
        });
    } catch (error) {
        console.error("Admin credits GET error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const { targetUserId, amount, reason } = await req.json();

        if (!targetUserId || amount === undefined || !reason) {
            return NextResponse.json({ error: "Missing targetUserId, amount, or reason" }, { status: 400 });
        }

        const adminUser = await prisma.user.findUnique({
            where: { email: session!.user.email! }
        });
        if (!adminUser) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

        // BLOCK: Admin cannot self-grant credits
        if (adminUser.id === targetUserId) {
            return NextResponse.json({ error: "Admin cannot adjust own credits" }, { status: 403 });
        }

        // Verify target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId }
        });
        if (!targetUser) return NextResponse.json({ error: "Target user not found" }, { status: 404 });

        let newBalance: number;

        if (amount > 0) {
            // Grant credits
            newBalance = await TokenService.grantCredits(
                targetUserId,
                amount,
                "admin",
                `Admin grant: ${reason}`,
            );
        } else if (amount < 0) {
            // Deduct credits
            const result = await TokenService.deductCredits(
                targetUserId,
                Math.abs(amount),
                `Admin deduction: ${reason}`,
            );
            if (!result.success) {
                return NextResponse.json({ error: "Insufficient balance for deduction" }, { status: 400 });
            }
            newBalance = result.newBalance;
        } else {
            return NextResponse.json({ error: "Amount cannot be zero" }, { status: 400 });
        }

        // Write audit log
        await logAdminAction(
            adminUser.id,
            "adjust_credits",
            targetUserId,
            reason,
            { amount, newBalance, targetEmail: targetUser.email }
        );

        return NextResponse.json({
            success: true,
            newBalance,
            message: `Adjusted ${amount} credits for user ${targetUserId}`
        });

    } catch (error) {
        console.error("Admin credit adjustment error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
