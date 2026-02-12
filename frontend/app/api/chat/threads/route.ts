
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = session.user.role;
        const email = session.user.email;

        // Filter threads based on role
        let where: any = {};
        if (role === 'USER') {
            where = { userEmail: email };
        } else if (role === 'GUIDE' || role === 'ORGANIZATION') {
            where = { guideEmail: email };
        } else {
            return NextResponse.json({ error: "Invalid role" }, { status: 403 });
        }

        const threads = await prisma.chatThread.findMany({
            where,
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1 // Only need last message
                }
            }
        });

        // Enrich threads
        const enrichedThreads = await Promise.all(threads.map(async (t) => {
            const request = await prisma.umrahRequest.findUnique({
                where: { id: t.requestId }
            });

            const lastMessage = t.messages[0];

            let displayTitle = request ? `${request.departureCity} - ${request.peopleCount} Kişi` : "Bilinmeyen Talep";
            let displayCounterparty = "";

            if (role === 'USER') {
                // User sees Guide
                const guideUser = await prisma.user.findUnique({
                    where: { email: t.guideEmail }
                });
                let guideProfile = null;
                if (guideUser) {
                    guideProfile = await prisma.guideProfile.findUnique({
                        where: { userId: guideUser.id }
                    });
                }
                displayCounterparty = guideProfile?.fullName || guideUser?.name || "Rehber";
            } else {
                // Guide sees User initials
                const user = await prisma.user.findUnique({
                    where: { email: t.userEmail }
                });
                const name = user?.name || "Misafir Kullanıcı";
                const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                displayCounterparty = initials;
            }

            return {
                id: t.id,
                requestId: t.requestId,
                displayTitle,
                displayCounterparty,
                lastMessage: lastMessage?.message || "",
                lastMessageTime: lastMessage?.createdAt.toISOString() || t.createdAt.toISOString()
            };
        }));

        // Sort by last activity
        enrichedThreads.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

        return NextResponse.json(enrichedThreads);

    } catch (error) {
        console.error("Fetch threads error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
