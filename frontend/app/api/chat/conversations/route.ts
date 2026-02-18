
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = session.user.role;
        let whereCondition: any = {};

        if (role === 'USER') {
            whereCondition = { userId: session.user.id };
        } else if (role === 'GUIDE' || role === 'ORGANIZATION') {
            whereCondition = { guideId: session.user.id };
        } else {
            // Admin sees all? Let's restrict to own for now, Admin has own panel
            return NextResponse.json({ error: "Use Admin panel" }, { status: 403 });
        }

        const conversations = await prisma.conversation.findMany({
            where: whereCondition,
            orderBy: { lastMessageAt: 'desc' },
            include: {
                request: {
                    select: { departureCity: true, dateRange: true } // Context
                },
                guide: {
                    select: { name: true, guideProfile: { select: { isDiyanet: true } } }
                },
                user: {
                    select: { name: true }
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: { body: true, createdAt: true, blocked: true }
                }
            }
        });

        // Format for frontend
        const formatted = conversations.map(c => {
            const counterpartyName = role === 'USER'
                ? (c.guide.name || "Rehber")
                : (c.user.name || "Kullanıcı");

            const lastMsg = c.messages[0];

            return {
                id: c.id,
                requestId: c.requestId,
                displayTitle: `${c.request.departureCity} - ${c.request.dateRange}`,
                displayCounterparty: counterpartyName,
                lastMessage: lastMsg?.blocked ? "Mesaj gizlendi" : (lastMsg?.body || ""),
                lastMessageTime: c.lastMessageAt,
            };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
