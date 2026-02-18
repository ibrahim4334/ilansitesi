
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const { id } = await params;

        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { email: true } }
            }
        });

        const formatted = messages.map(m => ({
            id: m.id,
            senderEmail: m.sender.email,
            body: m.body, // Admin sees everything
            blocked: m.blocked,
            createdAt: m.createdAt,
            role: m.role
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
