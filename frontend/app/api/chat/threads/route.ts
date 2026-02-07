
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const database = db.read();
        const role = session.user.role;
        const email = session.user.email;

        // Filter threads based on role
        let threads = [];
        if (role === 'USER') {
            threads = database.chatThreads.filter(t => t.userEmail === email);
        } else if (role === 'GUIDE' || role === 'ORGANIZATION') {
            threads = database.chatThreads.filter(t => t.guideEmail === email);
        } else {
            return NextResponse.json({ error: "Invalid role" }, { status: 403 });
        }

        // Enrich threads with necessary display info (last message, counterparty name)
        const enrichedThreads = threads.map(t => {
            const request = database.umrahRequests.find(r => r.id === t.requestId);
            const lastMessage = database.chatMessages
                .filter(m => m.threadId === t.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            let displayTitle = request ? `${request.departureCity} - ${request.peopleCount} Kişi` : "Bilinmeyen Talep";
            let displayCounterparty = "";

            if (role === 'USER') {
                // User sees Guide
                const guideProfile = database.guideProfiles.find(p =>
                    database.users.find((u: any) => u.email === t.guideEmail)?.id === p.userId
                );
                // Fallback to name from user record if profile not found or if guideEmail direct match
                const guideUser = database.users.find((u: any) => u.email === t.guideEmail);
                displayCounterparty = guideProfile?.fullName || guideUser?.name || "Rehber";

            } else {
                // Guide sees User
                // We do NOT expose full email. Just initials or "Misafir".
                // But prompt says: "GUIDE SIDE: Shows ... user initials (NOT email)"
                const user = database.users.find((u: any) => u.email === t.userEmail);
                const name = user?.name || "Misafir Kullanıcı";
                const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                displayCounterparty = `${initials} (${name.split(' ')[0]}...)`;
                // Or just name if not protecting name? Prompt says "user initials (NOT email)".
                // Let's use Initials.
                displayCounterparty = initials;
            }

            return {
                id: t.id,
                requestId: t.requestId,
                displayTitle,
                displayCounterparty,
                lastMessage: lastMessage?.message || "",
                lastMessageTime: lastMessage?.createdAt || t.createdAt
            };
        });

        // Sort by last activity
        enrichedThreads.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

        return NextResponse.json(enrichedThreads);

    } catch (error) {
        console.error("Fetch threads error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
