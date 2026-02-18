
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";

export async function GET(req: Request) {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const conversations = await prisma.conversation.findMany({
            orderBy: { lastMessageAt: 'desc' },
            include: {
                guide: { select: { email: true } },
                user: { select: { email: true } },
                _count: {
                    select: {
                        messages: { where: { blocked: true } }
                    }
                }
            },
            take: 50
        });

        const formatted = conversations.map(c => ({
            id: c.id,
            guideEmail: c.guide.email,
            userEmail: c.user.email,
            blockedCount: c._count.messages,
            lastMessageAt: c.lastMessageAt.toISOString()
        }));

        return NextResponse.json(formatted);

    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
