import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSupply } from "@/lib/api-guards";
import { spendToken } from "@/src/modules/tokens/application/spend-token.usecase";
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

        // Rate limit: 10 offers per minute
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

        const offerExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

        const spendResult = await spendToken({
            userId: guideUser.id,
            action: "OFFER_SEND",
            relatedId: requestId,
            reason: `Offer sent to request ${requestId}`,
        });

        if (!spendResult.ok) {
            if (spendResult.error === "INSUFFICIENT_TOKENS") {
                return NextResponse.json({
                    error: "INSUFFICIENT_CREDITS",
                    message: "Yetersiz Token",
                    balance: spendResult.newBalance,
                }, { status: 402 });
            }
            return NextResponse.json({ error: spendResult.error }, { status: 400 });
        }

        // ─── Create offer + conversation (post-spend) ───
        try {
            await prisma.$transaction(async (tx) => {
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

                // Create conversation if not exists
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
            });
        } catch (err: any) {
            if (err.code === "P2002") {
                return NextResponse.json({ message: "Offer already sent (race)", creditsRemaining: spendResult.newBalance }, { status: 200 });
            }
            throw err;
        }

        console.log(`[Offer] Guide ${guideUser.id} sent offer to request ${requestId}. Cost: ${spendResult.cost}, Balance: ${spendResult.newBalance}`);
        return NextResponse.json({
            message: "Offer sent",
            creditsRemaining: spendResult.newBalance,
        }, { status: 201 });

    } catch (error) {
        console.error("Offer error:", error);
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
    }
}
