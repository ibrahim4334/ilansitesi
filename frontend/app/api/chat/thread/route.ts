
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-guards";

const CHAT_THREAD_COST = 50; // Cost to start a conversation

export async function POST(req: Request) {
    try {
        const session = await auth();
        // Only Guide/Org starts conversations (usually via interest or direct)
        // User can start too? implementation_plan says "Guide/Org must PAY"
        // Let's assume this endpoint is called when Guide clicks "Mesaj Gönder" on a Request.

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { requestId, userId } = await req.json(); // userId is the target Umreci

        if (!requestId || !userId) {
            return NextResponse.json({ error: "Missing requestId or userId" }, { status: 400 });
        }

        // Banned check
        if (session.user.role === 'BANNED') {
            return NextResponse.json({ error: "Your account is banned." }, { status: 403 });
        }

        // Check if conversation already exists
        const existing = await prisma.conversation.findUnique({
            where: {
                requestId_guideId: {
                    requestId,
                    guideId: session.user.id
                }
            }
        });

        if (existing) {
            return NextResponse.json(existing);
        }

        // New Conversation -> Check Credits (If Guide/Org)
        if (session.user.role === 'GUIDE' || session.user.role === 'ORGANIZATION') {
            const guideProfile = await prisma.guideProfile.findUnique({
                where: { userId: session.user.id }
            });

            if (!guideProfile || guideProfile.credits < CHAT_THREAD_COST) {
                return NextResponse.json({
                    error: "Insufficient credits",
                    cost: CHAT_THREAD_COST
                }, { status: 402 });
            }

            // Deduct Credits
            await prisma.$transaction([
                prisma.guideProfile.update({
                    where: { userId: session.user.id },
                    data: { credits: { decrement: CHAT_THREAD_COST } }
                }),
                prisma.creditTransaction.create({
                    data: {
                        userId: session.user.id,
                        amount: -CHAT_THREAD_COST,
                        type: "spend",
                        reason: `Chat thread started for Request #${requestId}`,
                        relatedId: requestId
                    }
                }),
                prisma.conversation.create({
                    data: {
                        requestId,
                        guideId: session.user.id,
                        userId: userId,
                    }
                })
            ]);

            // Re-fetch to return
            const newConv = await prisma.conversation.findUnique({
                where: {
                    requestId_guideId: {
                        requestId,
                        guideId: session.user.id
                    }
                }
            });

            return NextResponse.json(newConv);
        }

        // If User starts (Free) - but logic says Guide pays to start. 
        // We will stick to the plan: User replies free, but usually Guide starts from Market.
        // If User initiates from their dashboard, they can only msg if thread exists? 
        // For now, let's allow User to create if we want, but plan says Guide pays.
        // We will restrict CREATION to Guides for now as per "Guide/Org must PAY" rule implying they start.

        return NextResponse.json({ error: "Only Guides can start conversations via this endpoint" }, { status: 403 });

    } catch (error) {
        console.error("Create Thread Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
