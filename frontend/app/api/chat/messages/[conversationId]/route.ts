
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { conversationId } = await params;

        // Membership check
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (conversation.userId !== session.user.id && conversation.guideId !== session.user.id && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                senderId: true,
                role: true,
                body: true,
                blocked: true,
                createdAt: true
            }
        });

        // Hide blocked content
        const safeMessages = messages.map(m => ({
            ...m,
            body: m.blocked ? "Mesaj moderasyon nedeniyle gizlendi" : m.body
        }));

        return NextResponse.json(safeMessages);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
