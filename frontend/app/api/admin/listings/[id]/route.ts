import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";
import { safeErrorMessage } from "@/lib/safe-error";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const body = await req.json();
        const { title, price, quota, active, approvalStatus } = body;

        const updated = await prisma.guideListing.update({
            where: { id: params.id },
            data: {
                title,
                price: price !== undefined ? Number(price) : undefined,
                quota: quota !== undefined ? Number(quota) : undefined,
                active: active !== undefined ? Boolean(active) : undefined,
                approvalStatus,
            }
        });

        // Add an audit log entry
        await prisma.adminAuditLog.create({
            data: {
                adminId: session!.user.id,
                action: "UPDATE_LISTING",
                targetType: "LISTING",
                targetId: params.id,
                details: `Admin updated listing: ${title}, Price: ${price}, Active: ${active}, Status: ${approvalStatus}`,
            }
        });

        return NextResponse.json({ success: true, listing: updated });
    } catch (error) {
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
    }
}
