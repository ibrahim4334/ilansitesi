
import { auth } from "@/lib/auth";
import { db, RequestInterest } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        // Allow GUIDE or ORGANIZATION
        if (!session?.user?.email || (session.user.role !== 'GUIDE' && session.user.role !== 'ORGANIZATION')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { requestId } = await req.json();
        if (!requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });

        const database = db.read();

        // Verify request exists and is open
        const request = database.umrahRequests.find(r => r.id === requestId);
        if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
        if (request.status !== "open") return NextResponse.json({ error: "Request is closed" }, { status: 400 });

        // Check for duplicate interest
        const existingInterest = database.requestInterests.find(
            i => i.requestId === requestId && i.guideEmail === session.user?.email
        );

        if (existingInterest) {
            return NextResponse.json({ message: "Already expressed interest" }, { status: 200 });
        }


        // TOKEN CHECK LOGIC
        const user = database.users.find((u: any) => u.email === session.user.email);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        let profile = database.guideProfiles.find(p => p.userId === user.id);

        if (!profile) {
            // Auto-create/ensure profile
            profile = {
                userId: user.id,
                fullName: session.user.name || "Unknown Guide",
                phone: "",
                city: "",
                credits: 0,
                tokens: 0, // Initial tokens
                quotaTarget: 30,
                currentCount: 0,
                isApproved: false,
                package: "FREEMIUM"
            };
            database.guideProfiles.push(profile);
        }

        // Initialize tokens if undefined (migration)
        if (profile.tokens === undefined) profile.tokens = 0;

        const { TokenService } = require("@/lib/token-service"); // Dynamic import to avoid circular dep issues if any

        const cost = TokenService.COST_CHAT_START; // Using Chat Start cost for Interest/Thread creation

        if (!TokenService.hasBalance(profile, cost)) {
            return NextResponse.json({ error: "INSUFFICIENT_CREDITS", message: "Yetersiz Token" }, { status: 402 }); // 402 Payment Required
        }

        // DEDUCT TOKENS
        profile.tokens -= cost;
        // Optimization: TokenService.deductTokens uses db.read/write internally, but we already have the db instance and reference.
        // To verify consistency using the service is better but here we have the lock (conceptually).
        // Let's just update the profile object here since we are about to write anyway.
        // Or call TokenService.deductTokens? But that reads DB again.
        // Let's update manually here for atomicity with the Thread creation in this same transaction.

        console.log(`Deducted ${cost} tokens from ${user.id}. New balance: ${profile.tokens}`);

        const newInterest: RequestInterest = {
            requestId,
            guideEmail: session.user.email,
            createdAt: new Date().toISOString()
        };

        database.requestInterests.push(newInterest);

        // Auto-create Chat Thread
        const existingThread = database.chatThreads.find(
            t => t.requestId === requestId && t.guideEmail === session.user.email
        );

        if (!existingThread) {
            const newThread = {
                id: crypto.randomUUID(),
                requestId,
                userEmail: request.userEmail,
                guideEmail: session.user.email,
                createdAt: new Date().toISOString()
            };
            database.chatThreads.push(newThread);
        }

        db.write(database);

        return NextResponse.json({ message: "Interest recorded", tokensRemaining: profile.tokens }, { status: 201 });

    } catch (error) {
        console.error("Interest error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
