import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-guards";

/**
 * PATCH /api/user/request-close — User closes their own request
 */
export async function PATCH(req: Request) {
    try {
        const session = await auth();
        const guard = requireRole(session, 'USER');
        if (guard) return guard;

        const { requestId } = await req.json();
        if (!requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });

        const request = await prisma.umrahRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

        // Verify ownership
        if (request.userEmail !== session!.user.email) {
            return NextResponse.json({ error: "Not your request" }, { status: 403 });
        }

        if (request.status !== 'open') {
            return NextResponse.json({ error: "Request is not open" }, { status: 400 });
        }

        await prisma.umrahRequest.update({
            where: { id: requestId },
            data: { status: "closed" }
        });

        return NextResponse.json({ success: true, message: `Request ${requestId} closed` });

    } catch (error) {
        console.error("User request close error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
