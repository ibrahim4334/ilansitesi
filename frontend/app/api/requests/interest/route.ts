import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSupply } from "@/lib/api-guards";
import { TokenService } from "@/lib/token-service";

export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireSupply(session);
        if (guard) return guard;

        const { requestId } = await req.json();
        if (!requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });

        // Verify request exists and is open
        const request = await prisma.umrahRequest.findUnique({
            where: { id: requestId }
        });
        if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
        if (request.status !== "open") return NextResponse.json({ error: "Request is closed" }, { status: 400 });

        // Check for duplicate interest
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
        let profile = await prisma.guideProfile.findUnique({
            where: { userId: guideUser.id }
        });

        if (!profile) {
            profile = await prisma.guideProfile.create({
                data: {
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
        }

        // ─── Determine cost: GUIDE=5, ORG=10 ───
        const cost = session!.user.role === 'ORGANIZATION'
            ? TokenService.COST_ORG_INTEREST
            : TokenService.COST_GUIDE_INTEREST;

        // ─── Deduct credits atomically (balance check inside $transaction) ───
        const deductResult = await TokenService.deductCredits(
            guideUser.id,
            cost,
            `Express interest in request ${requestId}`,
            requestId
        );

        if (!deductResult.success) {
            return NextResponse.json({
                error: "INSUFFICIENT_CREDITS",
                message: "Yetersiz Kredi",
                balance: deductResult.newBalance
            }, { status: 402 });
        }

        // ─── Create interest + conversation atomically ───
        await prisma.$transaction(async (tx) => {
            await tx.requestInterest.create({
                data: {
                    requestId,
                    guideEmail: session!.user!.email!,
                }
            });

            // Auto-create conversation (ONLY way conversations are created)
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
        });

        console.log(`Deducted ${cost} credits from ${guideUser.id} (${session!.user.role}). New balance: ${deductResult.newBalance}`);

        return NextResponse.json({ message: "Interest recorded", creditsRemaining: deductResult.newBalance }, { status: 201 });

    } catch (error) {
        console.error("Interest error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

