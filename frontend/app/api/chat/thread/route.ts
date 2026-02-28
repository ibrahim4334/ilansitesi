import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { spendToken } from "@/src/modules/tokens/application/spend-token.usecase";
import { rateLimit } from "@/lib/rate-limit";

const CHAT_THREAD_COST = 50; // TODO: move to TOKEN_COSTS in package-system.ts

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const guideId = session.user.id;

        // Rate limit: 5 threads per minute per user
        const rl = rateLimit(`thread:${guideId}`, 60_000, 5);
        if (!rl.success) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        const { requestId, userId } = await req.json(); // userId is the target Umreci

        if (!requestId || !userId) {
            return NextResponse.json({ error: "Missing requestId or userId" }, { status: 400 });
        }

        // Banned check
        if (session.user.role === 'BANNED') {
            return NextResponse.json({ error: "Your account is banned." }, { status: 403 });
        }

        // Only Guides/Orgs start conversations (they pay)
        if (session.user.role !== 'GUIDE' && session.user.role !== 'ORGANIZATION') {
            return NextResponse.json({ error: "Only Guides and Organizations can start conversations via this endpoint" }, { status: 403 });
        }

        // Check if conversation already exists — free early return
        const existing = await prisma.conversation.findUnique({
            where: {
                requestId_guideId: {
                    requestId,
                    guideId
                }
            }
        });

        if (existing) {
            return NextResponse.json(existing);
        }

        const spendResult = await spendToken({
            userId: guideId,
            action: "DEMAND_UNLOCK",
            relatedId: requestId,
            reason: `Start conversation for request ${requestId}`,
        });

        if (!spendResult.ok) {
            if (spendResult.error === "INSUFFICIENT_TOKENS") {
                return NextResponse.json({
                    error: "Insufficient credits",
                    cost: CHAT_THREAD_COST,
                    balance: spendResult.newBalance,
                }, { status: 402 });
            }
            return NextResponse.json({ error: spendResult.error }, { status: 400 });
        }

        // ─── Create conversation (post-spend) ───
        try {
            const newConv = await prisma.conversation.create({
                data: {
                    requestId,
                    guideId,
                    userId: userId,
                }
            });

            return NextResponse.json(newConv);
        } catch (error: any) {
            // P2002: parallel call already created the conversation — return existing
            if (error.code === 'P2002') {
                const existingConv = await prisma.conversation.findUnique({
                    where: {
                        requestId_guideId: {
                            requestId,
                            guideId
                        }
                    }
                });
                if (existingConv) return NextResponse.json(existingConv);
            }
            throw error;
        }

    } catch (error) {
        console.error("Create Thread Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
