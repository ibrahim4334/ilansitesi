
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-guards";
import { TokenService } from "@/lib/token-service";
import { rateLimit } from "@/lib/rate-limit";

const CHAT_THREAD_COST = 50; // Cost to start a conversation

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const guideId = session.user.id; // string, narrowed from string|undefined above

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

        // Deterministic idempotency key
        const idempotencyKey = `thread:${session.user.id}:${requestId}`;

        // ─── FULLY ATOMIC: balance check + deduct + conversation creation in ONE tx ───
        // Previously, credits were deducted by TokenService (Tx#1) and conversation was
        // created afterward (outside Tx#1). If conversation creation failed, credits were
        // permanently lost. Now everything is in a single SERIALIZABLE transaction.
        try {
            const conversation = await prisma.$transaction(async (tx) => {
                // (1) Idempotency check
                const existingLedger = await tx.creditTransaction.findUnique({
                    where: { idempotencyKey }
                });
                if (existingLedger) {
                    // Credits already deducted — ensure conversation exists
                    const conv = await tx.conversation.findUnique({
                        where: {
                            requestId_guideId: {
                                requestId,
                                guideId
                            }
                        }
                    });
                    return conv;
                }

                // (2) Row-level lock on balance
                const [balanceRow] = await tx.$queryRaw<[{ balance: number }]>`
                    SELECT COALESCE(SUM(amount), 0) AS balance
                    FROM credit_transactions
                    WHERE userId = ${guideId}
                    FOR UPDATE
                `;
                const currentBalance = Number(balanceRow.balance);

                // (3) Strict non-negative guard
                if (currentBalance - CHAT_THREAD_COST < 0) {
                    throw new Error('INSUFFICIENT_CREDITS');
                }

                // (4) Write deduction to ledger
                await tx.creditTransaction.create({
                    data: {
                        userId: guideId,
                        amount: -CHAT_THREAD_COST,
                        type: "spend",
                        reason: `Chat thread started for Request #${requestId}`,
                        relatedId: requestId,
                        idempotencyKey,
                    }
                });

                // (5) Update GuideProfile cache
                const updated = await tx.guideProfile.update({
                    where: { userId: guideId },
                    data: { credits: { decrement: CHAT_THREAD_COST } }
                });

                // Safety: ensure cache non-negative
                if (updated.credits < 0) {
                    await tx.guideProfile.update({
                        where: { userId: guideId },
                        data: { credits: 0 }
                    });
                }

                // (6) Create conversation — inside the SAME transaction
                const newConv = await tx.conversation.create({
                    data: {
                        requestId,
                        guideId,
                        userId: userId,
                    }
                });

                return newConv;
            }, {
                isolationLevel: 'Serializable',
                timeout: 10000,
            });

            return NextResponse.json(conversation);

        } catch (error: any) {
            if (error.message === 'INSUFFICIENT_CREDITS') {
                return NextResponse.json({
                    error: "Insufficient credits",
                    cost: CHAT_THREAD_COST,
                    balance: await TokenService.getBalance(session.user.id)
                }, { status: 402 });
            }
            // P2002: parallel call already inserted the idempotency key — safe to return existing conversation
            if (error.code === 'P2002') {
                const existingConv = await prisma.conversation.findUnique({
                    where: {
                        requestId_guideId: {
                            requestId,
                            guideId: session.user.id
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
