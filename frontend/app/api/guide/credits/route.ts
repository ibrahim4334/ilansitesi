import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = session.user.role;
        if (role !== 'GUIDE' && role !== 'ORGANIZATION') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const transactions = await prisma.creditTransaction.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const profile = await prisma.guideProfile.findUnique({
            where: { userId: user.id },
            select: { credits: true }
        });

        return NextResponse.json({
            balance: profile?.credits || 0,
            transactions: transactions.map(t => ({
                id: t.id,
                amount: t.amount,
                type: t.type,
                reason: t.reason,
                relatedId: t.relatedId,
                createdAt: t.createdAt.toISOString(),
            }))
        });
    } catch (error) {
        console.error("Guide credits error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
