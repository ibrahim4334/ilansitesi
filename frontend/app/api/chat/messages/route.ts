
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (session.user.role === 'BANNED') return NextResponse.json({ error: "Account banned" }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const threadId = searchParams.get('threadId');

        if (!threadId) return NextResponse.json({ error: "Missing threadId" }, { status: 400 });

        const thread = await prisma.chatThread.findUnique({
            where: { id: threadId }
        });

        if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

        // Security: Ensure participant
        const isParticipant = (session.user.role === 'USER' && thread.userEmail === session.user.email) ||
            ((session.user.role === 'GUIDE' || session.user.role === 'ORGANIZATION') && thread.guideEmail === session.user.email);

        if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const messages = await prisma.chatMessage.findMany({
            where: { threadId },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json(messages.map(m => ({
            ...m,
            createdAt: m.createdAt.toISOString()
        })));

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (session.user.role === 'BANNED') return NextResponse.json({ error: "Account banned" }, { status: 403 });

        const body = await req.json();
        const { threadId, message } = body;

        if (!threadId || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // Fix #13: Message length limit (2000 chars)
        if (typeof message !== 'string' || message.length > 2000) {
            return NextResponse.json({ error: "Message too long (max 2000 characters)" }, { status: 400 });
        }

        if (message.trim().length === 0) {
            return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
        }

        const thread = await prisma.chatThread.findUnique({
            where: { id: threadId }
        });

        if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

        // Security: Ensure participant
        const isParticipant = (session.user.role === 'USER' && thread.userEmail === session.user.email) ||
            ((session.user.role === 'GUIDE' || session.user.role === 'ORGANIZATION') && thread.guideEmail === session.user.email);

        if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Fix #14: Rate limit — 3-second cooldown per thread per user
        const lastMessage = await prisma.chatMessage.findFirst({
            where: {
                threadId,
                senderRole: session.user.role as string,
            },
            orderBy: { createdAt: 'desc' }
        });

        if (lastMessage) {
            const timeSinceLastMs = Date.now() - lastMessage.createdAt.getTime();
            if (timeSinceLastMs < 3000) {
                return NextResponse.json({ error: "Too fast. Wait a moment." }, { status: 429 });
            }
        }

        const newMessage = await prisma.chatMessage.create({
            data: {
                threadId,
                senderRole: session.user.role as string,
                message: message.trim().substring(0, 2000), // Double-guard
            }
        });

        return NextResponse.json({
            ...newMessage,
            createdAt: newMessage.createdAt.toISOString()
        });

    } catch (error) {
        console.error("Send message error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
