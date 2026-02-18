
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { containsProfanity } from "@/lib/bannedWords";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // BANNED check
        if (session.user.role === 'BANNED') {
            return NextResponse.json({ error: "Account banned" }, { status: 403 });
        }

        const { conversationId, body } = await req.json();

        if (!conversationId || !body || !body.trim()) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // ─── 500-char limit ───
        if (typeof body !== 'string' || body.length > 500) {
            return NextResponse.json({ error: "Message too long (max 500 characters)" }, { status: 400 });
        }

        // Verify membership
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { guide: true, user: true }
        });

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        if (conversation.guideId !== session.user.id && conversation.userId !== session.user.id && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // ─── 2-second rate limit ───
        const lastMessage = await prisma.message.findFirst({
            where: {
                conversationId,
                senderId: session.user.id,
            },
            orderBy: { createdAt: 'desc' }
        });

        if (lastMessage) {
            const timeSinceLastMs = Date.now() - lastMessage.createdAt.getTime();
            if (timeSinceLastMs < 2000) {
                return NextResponse.json({ error: "Too fast. Wait a moment." }, { status: 429 });
            }
        }

        // Profanity Check
        const isBlocked = containsProfanity(body);

        // Save Message
        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId: session.user.id,
                role: session.user.role || "USER",
                body: body.trim().substring(0, 500),
                blocked: isBlocked
            }
        });

        // Update Conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() }
        });

        // Log Moderation if blocked
        if (isBlocked) {
            await prisma.moderationLog.create({
                data: {
                    messageId: message.id,
                    reason: "Profanity detected"
                }
            });
            return NextResponse.json({
                error: "Mesajınız uygunsuz içerik nedeniyle engellendi.",
                blocked: true
            }, { status: 400 });
        }

        return NextResponse.json(message);

    } catch (error) {
        console.error("Send Message Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
