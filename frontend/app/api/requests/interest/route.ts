import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSupply } from "@/lib/api-guards";
import { TokenService } from "@/lib/token-service";
import { rateLimit } from "@/lib/rate-limit";
import { withSerializableRetry } from "@/lib/with-retry";
import { getRoleConfig } from "@/lib/role-config";
import { safeErrorMessage } from "@/lib/safe-error";

export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireSupply(session);
        if (guard) return guard;

        const { requestId } = await req.json();
        if (!requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });

        // Rate limit: 10 interests per minute per guide
        const user = session!.user;
        const rl = rateLimit(`interest:${user.email}`, 60_000, 10);
        if (!rl.success) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        // Verify request exists and is open
        const request = await prisma.umrahRequest.findUnique({
            where: { id: requestId }
        });
        if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
        if (request.status !== "open") return NextResponse.json({ error: "Request is closed" }, { status: 400 });

        // Check for duplicate interest (idempotent early exit — free, no credits needed)
        const existingInterest = await prisma.requestInterest.findUnique({
            where: {
                requestId_guideEmail: {
                    requestId,
                    guideEmail: session!.user.email!
                }
            }
        });

        if (existingInterest) {
            return NextResponse.json({ message: "Already expressed interest" }, { status: 200 });
        }

        // Find guide user
        const guideUser = await prisma.user.findUnique({
            where: { email: session!.user.email! }
        });
        if (!guideUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Find request owner
        const requestOwner = await prisma.user.findUnique({
            where: { email: request.userEmail }
        });
        if (!requestOwner) return NextResponse.json({ error: "Request owner not found" }, { status: 404 });

        // Ensure guide profile exists
        await prisma.guideProfile.upsert({
            where: { userId: guideUser.id },
            update: {},
            create: {
                userId: guideUser.id,
                fullName: session!.user.name || "Unknown Guide",
                phone: "",
                city: "",
                credits: 0,
                tokens: 0,
                quotaTarget: 30,
                currentCount: 0,
                isApproved: false,
                package: "FREEMIUM"
            }
        });

        // ─── Get cost from ROLE_CONFIG ───
        const roleConfig = getRoleConfig(session!.user.role);
        const cost = roleConfig.interestCost;

        // ─── Daily interest limit check ───
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const dailyInterestCount = await prisma.requestInterest.count({
            where: {
                guideEmail: session!.user.email!,
                createdAt: { gte: startOfDay },
            }
        });
        if (dailyInterestCount >= roleConfig.maxDailyInterests) {
            return NextResponse.json(
                { error: "Daily interest limit reached", limit: roleConfig.maxDailyInterests },
                { status: 429 }
            );
        }

        // Deterministic idempotency key: prevents double-charge on network retries
        const idempotencyKey = `interest:${guideUser.id}:${requestId}`;

        // ─── FULLY ATOMIC with retry: balance check + deduct + interest + conversation ───
        let newBalance: number;
        try {
            const result = await withSerializableRetry(() => prisma.$transaction(async (tx) => {
                // (1) Idempotency check — if this key exists, the action already completed
                const existingLedger = await tx.creditTransaction.findUnique({
                    where: { idempotencyKey }
                });
                if (existingLedger) {
                    const bal = await tx.creditTransaction.aggregate({
                        where: { userId: guideUser.id },
                        _sum: { amount: true }
                    });
                    return { balance: bal._sum.amount || 0, idempotent: true };
                }

                // (2) Row-level lock on balance (prevents concurrent double-spend)
                const [balanceRow] = await tx.$queryRaw<[{ balance: number }]>`
                    SELECT COALESCE(SUM(amount), 0) AS balance
                    FROM credit_transactions
                    WHERE userId = ${guideUser.id}
                    FOR UPDATE
                `;
                const currentBalance = Number(balanceRow.balance);

                // (3) Strict balance guard
                if (currentBalance - cost < 0) {
                    throw new Error('INSUFFICIENT_CREDITS');
                }

                // (4) Write credit deduction to ledger
                await tx.creditTransaction.create({
                    data: {
                        userId: guideUser.id,
                        amount: -cost,
                        type: "spend",
                        reason: `Express interest in request ${requestId}`,
                        relatedId: requestId,
                        idempotencyKey,
                    }
                });

                // (5) Update GuideProfile cache
                const updated = await tx.guideProfile.update({
                    where: { userId: guideUser.id },
                    data: { credits: { decrement: cost } }
                });

                // (6) Create interest record
                await tx.requestInterest.create({
                    data: {
                        requestId,
                        guideEmail: session!.user!.email!,
                    }
                });

                // (7) Create conversation (if not already exists)
                const existingConvo = await tx.conversation.findUnique({
                    where: {
                        requestId_guideId: {
                            requestId,
                            guideId: guideUser.id
                        }
                    }
                });

                if (!existingConvo) {
                    await tx.conversation.create({
                        data: {
                            requestId,
                            guideId: guideUser.id,
                            userId: requestOwner.id,
                        }
                    });
                }

                return { balance: Math.max(0, updated.credits), idempotent: false };
            }, {
                isolationLevel: 'Serializable',
                timeout: 10000,
            }));

            newBalance = result.balance;
            if (result.idempotent) {
                return NextResponse.json({ message: "Interest already recorded (idempotent)", creditsRemaining: newBalance }, { status: 200 });
            }

        } catch (error: any) {
            if (error.message === 'INSUFFICIENT_CREDITS') {
                const balance = await TokenService.getBalance(guideUser.id);
                return NextResponse.json({
                    error: "INSUFFICIENT_CREDITS",
                    message: "Yetersiz Kredi",
                    balance
                }, { status: 402 });
            }
            // Unique constraint on idempotencyKey — parallel race condition resolved
            if (error.code === 'P2002') {
                const balance = await TokenService.getBalance(guideUser.id);
                return NextResponse.json({ message: "Interest already recorded", creditsRemaining: balance }, { status: 200 });
            }
            throw error;
        }

        console.log(`[Interest] Deducted ${cost} credits from ${guideUser.id} (${session!.user.role}). New balance: ${newBalance}`);
        return NextResponse.json({ message: "Interest recorded", creditsRemaining: newBalance }, { status: 201 });

    } catch (error) {
        console.error("Interest error:", error);
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
    }
}
