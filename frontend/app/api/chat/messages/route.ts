
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { containsProfanity } from "@/lib/bannedWords";

/**
 * GET /api/chat/messages?threadId=xxx
 * Fetch messages for a conversation. Participant-only.
 * NOTE: `threadId` param name kept for frontend compatibility — it maps to conversationId.
 */
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (session.user.role === 'BANNED') return NextResponse.json({ error: "Account banned" }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const threadId = searchParams.get('threadId');

        if (!threadId) return NextResponse.json({ error: "Missing threadId" }, { status: 400 });

        // Find the user
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });
        if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Find conversation
        const conversation = await prisma.conversation.findUnique({
            where: { id: threadId }
        });

        if (!conversation) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

        // Security: Ensure participant (by userId)
        const isParticipant = conversation.userId === currentUser.id || conversation.guideId === currentUser.id;
        if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const messages = await prisma.message.findMany({
            where: { conversationId: threadId },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json(messages.map(m => ({
            id: m.id,
            threadId: m.conversationId, // backwards compat
            senderRole: m.role,
            message: m.body,
            blocked: m.blocked,
            createdAt: m.createdAt.toISOString()
        })));

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/chat/messages
 * Send a message in a conversation. Participant-only.
 * Max 500 chars, 2s rate limit, profanity filter.
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (session.user.role === 'BANNED') return NextResponse.json({ error: "Account banned" }, { status: 403 });

        const body = await req.json();
        const { threadId, message } = body;

        if (!threadId || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // Max 500 chars
        if (typeof message !== 'string' || message.length > 500) {
            return NextResponse.json({ error: "Message too long (max 500 characters)" }, { status: 400 });
        }

        if (message.trim().length === 0) {
            return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
        }

        // Find the user
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });
        if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const conversation = await prisma.conversation.findUnique({
            where: { id: threadId }
        });

        if (!conversation) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

        // Security: Ensure participant
        const isParticipant = conversation.userId === currentUser.id || conversation.guideId === currentUser.id;
        if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Rate limit — 2-second cooldown per user per conversation
        const lastMessage = await prisma.message.findFirst({
            where: {
                conversationId: threadId,
                senderId: currentUser.id,
            },
            orderBy: { createdAt: 'desc' }
        });

        if (lastMessage) {
            const timeSinceLastMs = Date.now() - lastMessage.createdAt.getTime();
            if (timeSinceLastMs < 2000) {
                return NextResponse.json({ error: "Too fast. Wait a moment." }, { status: 429 });
            }
        }

        // Profanity filter
        const isBlocked = containsProfanity(message);

        const newMessage = await prisma.message.create({
            data: {
                conversationId: threadId,
                senderId: currentUser.id,
                role: session.user.role as string,
                body: message.trim().substring(0, 500),
                blocked: isBlocked,
            }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: threadId },
            data: { lastMessageAt: new Date() }
        });

        // Log moderation if blocked
        if (isBlocked) {
            await prisma.moderationLog.create({
                data: {
                    messageId: newMessage.id,
                    reason: "Profanity filter"
                }
            });
        }

        return NextResponse.json({
            id: newMessage.id,
            threadId: newMessage.conversationId,
            senderRole: newMessage.role,
            message: newMessage.body,
            blocked: newMessage.blocked,
            createdAt: newMessage.createdAt.toISOString()
        });

    } catch (error) {
        console.error("Send message error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
