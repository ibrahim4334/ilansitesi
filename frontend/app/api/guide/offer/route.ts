import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSupply } from "@/lib/api-guards";
import { TokenService } from "@/lib/token-service";
import { getRoleConfig } from "@/lib/role-config";
import { rateLimit } from "@/lib/rate-limit";
import { withSerializableRetry } from "@/lib/with-retry";
import { safeErrorMessage } from "@/lib/safe-error";

/**
 * POST /api/guide/offer
 * Send an offer to a user's umrah request. Costs tokens.
 *
 * Body: { requestId: string, price: number, currency?: string, message?: string }
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireSupply(session);
        if (guard) return guard;

        const roleConfig = getRoleConfig(session!.user.role);
        if (!roleConfig.canSendOffer) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { requestId, price, currency, message } = body;

        if (!requestId || typeof requestId !== "string") {
            return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
        }
        if (!price || typeof price !== "number" || price <= 0) {
            return NextResponse.json({ error: "Invalid price" }, { status: 400 });
        }

        // Rate limit: maxDailyOffers per day
        const rl = rateLimit(`offer:${session!.user.email}`, 60_000, 10);
        if (!rl.success) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        // Resolve guide user
        const guideUser = await prisma.user.findUnique({
            where: { email: session!.user.email! },
            select: { id: true },
        });
        if (!guideUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Verify request exists and is open
        const request = await prisma.umrahRequest.findUnique({
            where: { id: requestId },
        });
        if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
        if (request.status !== "open") return NextResponse.json({ error: "Request is closed" }, { status: 400 });

        // Check daily offer count
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const dailyOfferCount = await prisma.offer.count({
            where: {
                guideId: guideUser.id,
                createdAt: { gte: startOfDay },
            },
        });
        if (dailyOfferCount >= roleConfig.maxDailyOffers) {
            return NextResponse.json(
                { error: "Daily offer limit reached", limit: roleConfig.maxDailyOffers },
                { status: 429 }
            );
        }

        // Check for existing offer (idempotent)
        const existingOffer = await prisma.offer.findUnique({
            where: { guideId_requestId: { guideId: guideUser.id, requestId } },
        });
        if (existingOffer) {
            return NextResponse.json({ message: "Offer already sent", offer: existingOffer }, { status: 200 });
        }

        const cost = roleConfig.offerCost;
        const idempotencyKey = `offer:${guideUser.id}:${requestId}`;
        const offerExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

        // Atomic: deduct tokens + create offer + create conversation
        let newBalance: number;
        try {
            const result = await withSerializableRetry(() => prisma.$transaction(async (tx) => {
                // (1) Idempotency check
                const existingLedger = await tx.creditTransaction.findUnique({
                    where: { idempotencyKey },
                });
                if (existingLedger) {
                    const bal = await tx.creditTransaction.aggregate({
                        where: { userId: guideUser.id },
                        _sum: { amount: true },
                    });
                    return { balance: bal._sum.amount || 0, idempotent: true };
                }

                // (2) Lock + balance check
                const [balanceRow] = await tx.$queryRaw<[{ balance: number }]>`
                    SELECT COALESCE(SUM(amount), 0) AS balance
                    FROM credit_transactions
                    WHERE userId = ${guideUser.id}
                    FOR UPDATE
                `;
                const currentBalance = Number(balanceRow.balance);

                if (currentBalance - cost < 0) {
                    throw new Error("INSUFFICIENT_CREDITS");
                }

                // (3) Deduct tokens
                await tx.creditTransaction.create({
                    data: {
                        userId: guideUser.id,
                        amount: -cost,
                        type: "spend",
                        reason: `Offer sent to request ${requestId}`,
                        relatedId: requestId,
                        idempotencyKey,
                    },
                });

                // (4) Update cache
                const updated = await tx.guideProfile.update({
                    where: { userId: guideUser.id },
                    data: { credits: { decrement: cost } },
                });

                // (5) Create offer
                await tx.offer.create({
                    data: {
                        guideId: guideUser.id,
                        requestId,
                        price,
                        currency: currency || "SAR",
                        message: message?.trim()?.substring(0, 1000) || null,
                        status: "pending",
                        expiresAt: offerExpiresAt,
                    },
                });

                // (6) Create conversation if not exists (for messaging after offer)
                const requestOwner = await tx.user.findUnique({
                    where: { email: request.userEmail },
                    select: { id: true },
                });
                if (requestOwner) {
                    const existingConvo = await tx.conversation.findUnique({
                        where: {
                            requestId_guideId: { requestId, guideId: guideUser.id },
                        },
                    });
                    if (!existingConvo) {
                        await tx.conversation.create({
                            data: { requestId, guideId: guideUser.id, userId: requestOwner.id },
                        });
                    }
                }

                return { balance: Math.max(0, updated.credits), idempotent: false };
            }, {
                isolationLevel: "Serializable",
                timeout: 10_000,
            }));

            newBalance = result.balance;
            if (result.idempotent) {
                return NextResponse.json({ message: "Offer already recorded (idempotent)", creditsRemaining: newBalance }, { status: 200 });
            }
        } catch (error: any) {
            if (error.message === "INSUFFICIENT_CREDITS") {
                const balance = await TokenService.getBalance(guideUser.id);
                return NextResponse.json({
                    error: "INSUFFICIENT_CREDITS",
                    message: "Yetersiz Token",
                    balance,
                }, { status: 402 });
            }
            if (error.code === "P2002") {
                const balance = await TokenService.getBalance(guideUser.id);
                return NextResponse.json({ message: "Offer already sent", creditsRemaining: balance }, { status: 200 });
            }
            throw error;
        }

        console.log(`[Offer] Guide ${guideUser.id} sent offer to request ${requestId}. Cost: ${cost}, Balance: ${newBalance}`);
        return NextResponse.json({
            message: "Offer sent",
            creditsRemaining: newBalance,
        }, { status: 201 });

    } catch (error) {
        console.error("Offer error:", error);
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
    }
}
