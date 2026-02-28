import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSupply } from "@/lib/api-guards";

export async function GET() {
    try {
        const session = await auth();
        const guard = requireSupply(session);
        if (guard) return guard;

        const user = await prisma.user.findUnique({
            where: { email: session!.user.email! },
            select: { id: true, tokenBalance: true },
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Read from unified ledger (token_ledger_entries / tokenTransaction)
        const transactions = await prisma.tokenTransaction.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json({
            balance: user.tokenBalance,
            transactions: transactions.map(t => ({
                id: t.id,
                amount: t.amount,
                type: t.entryType,
                reason: t.reasonCode,
                relatedId: t.referenceId,
                createdAt: t.createdAt.toISOString(),
            }))
        });
    } catch (error) {
        console.error("Guide credits error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
