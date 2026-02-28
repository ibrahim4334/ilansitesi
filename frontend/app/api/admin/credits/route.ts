import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";
import { logAdminAction } from "@/lib/admin-audit";
import { grantToken } from "@/src/modules/tokens/application/grant-token.usecase";
import { spendToken } from "@/src/modules/tokens/application/spend-token.usecase";

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
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tokenBalance: true,
                isMuted: true,
                mutedUntil: true,
                guideProfile: { select: { fullName: true, package: true } },
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Read from unified ledger (token_ledger_entries)
        const transactions = await prisma.tokenTransaction.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                guideName: user.guideProfile?.fullName,
                package: user.guideProfile?.package,
                isMuted: user.isMuted,
                mutedUntil: user.mutedUntil,
            },
            balance: user.tokenBalance,
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

        // Mandatory idempotency key for admin adjustments
        const idempotencyKey = `admin-adjust:${adminUser.id}:${targetUserId}:${amount}:${Date.now()}`;

        if (amount > 0) {
            // Grant tokens via unified ledger
            const result = await grantToken({
                userId: targetUserId,
                amount,
                type: "ADMIN_GRANT",
                reason: `Admin grant: ${reason}`,
                idempotencyKey,
            });
            newBalance = result.newBalance;
        } else if (amount < 0) {
            // Deduct tokens via unified ledger
            const result = await spendToken({
                userId: targetUserId,
                action: "DEMAND_UNLOCK", // Generic action for admin deductions
                relatedId: undefined,
                reason: `Admin deduction: ${reason}`,
            });
            if (!result.ok) {
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
