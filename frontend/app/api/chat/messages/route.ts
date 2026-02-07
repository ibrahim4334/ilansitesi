
import { auth } from "@/lib/auth";
import { db, ChatMessage } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const threadId = searchParams.get('threadId');

        if (!threadId) return NextResponse.json({ error: "Missing threadId" }, { status: 400 });

        const database = db.read();
        const thread = database.chatThreads.find(t => t.id === threadId);

        if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

        // Security: Ensure participant
        const isParticipant = (session.user.role === 'USER' && thread.userEmail === session.user.email) ||
            ((session.user.role === 'GUIDE' || session.user.role === 'ORGANIZATION') && thread.guideEmail === session.user.email);

        if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const messages = database.chatMessages
            .filter(m => m.threadId === threadId)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        return NextResponse.json(messages);

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { threadId, message } = body;

        if (!threadId || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const database = db.read();
        const thread = database.chatThreads.find(t => t.id === threadId);

        if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

        // Security: Ensure participant
        const isParticipant = (session.user.role === 'USER' && thread.userEmail === session.user.email) ||
            ((session.user.role === 'GUIDE' || session.user.role === 'ORGANIZATION') && thread.guideEmail === session.user.email);

        if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            threadId,
            senderRole: session.user.role as "USER" | "GUIDE" | "ORGANIZATION",
            message,
            createdAt: new Date().toISOString()
        };

        database.chatMessages.push(newMessage);
        db.write(database);

        return NextResponse.json(newMessage);

    } catch (error) {
        console.error("Send message error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
