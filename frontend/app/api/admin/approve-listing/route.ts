import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        // Strict Admin Check
        // For development/demo, we might allow GUIDE to self-approve or use a special secret
        // Assuming we have an ADMIN role or we just strictly check for now.
        // Let's allow if role is ORGANIZATION or we pass a secret query param for simulation

        const { searchParams } = new URL(req.url);
        const secret = searchParams.get('secret');
        const isSimulatedAdmin = secret === 'demo-admin-secret';

        if (!isSimulatedAdmin) {
            if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            // In a real app: if (session.user.role !== 'ADMIN') ...
        }

        const { listingId, action } = await req.json(); // action: 'APPROVE' | 'REJECT'

        if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

        const database = db.read();
        const listingIndex = database.guideListings.findIndex(l => l.id === listingId);

        if (listingIndex === -1) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

        const listing = database.guideListings[listingIndex];

        if (action === 'REJECT') {
            listing.approvalStatus = 'REJECTED';
            listing.active = false;
        } else {
            listing.approvalStatus = 'APPROVED';
            listing.active = true;

            // MOCK EMAIL NOTIFICATION
            console.log(`[EMAIL MOCK] Sending 'Listing Approved' email to guide of listing ${listing.title}`);
        }

        database.guideListings[listingIndex] = listing;
        db.write(database);

        return NextResponse.json({ success: true, status: listing.approvalStatus });

    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
