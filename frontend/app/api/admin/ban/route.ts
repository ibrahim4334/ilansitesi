import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";
import { logAdminAction } from "@/lib/admin-audit";

/**
 * POST /api/admin/ban — Ban a user (cannot ban ADMIN)
 * Stores previousRole for unban restoration.
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const { targetUserId, reason } = await req.json();

        if (!targetUserId || !reason) {
            return NextResponse.json({ error: "Missing targetUserId or reason" }, { status: 400 });
        }

        const adminUser = await prisma.user.findUnique({
            where: { email: session!.user.email! }
        });
        if (!adminUser) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

        // Verify target exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId }
        });
        if (!targetUser) return NextResponse.json({ error: "Target user not found" }, { status: 404 });

        // Cannot ban another ADMIN
        if (targetUser.role === 'ADMIN') {
            return NextResponse.json({ error: "Cannot ban an ADMIN user" }, { status: 403 });
        }

        // Cannot ban already banned user
        if (targetUser.role === 'BANNED') {
            return NextResponse.json({ error: "User is already banned" }, { status: 400 });
        }

        // Store previous role for unban, then set BANNED
        await prisma.user.update({
            where: { id: targetUserId },
            data: {
                role: "BANNED",
                previousRole: targetUser.role // Store for unban
            }
        });

        // Deactivate all guide listings
        await prisma.guideListing.updateMany({
            where: { guideId: targetUserId },
            data: { active: false }
        });

        // Write audit log
        await logAdminAction(
            adminUser.id,
            "ban_user",
            targetUserId,
            reason,
            { targetEmail: targetUser.email, previousRole: targetUser.role }
        );

        return NextResponse.json({ success: true, message: `User ${targetUserId} banned` });

    } catch (error) {
        console.error("Admin ban error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

/**
 * PUT /api/admin/ban — Unban a user, restoring previous role.
 */
export async function PUT(req: Request) {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const { targetUserId, reason } = await req.json();

        if (!targetUserId || !reason) {
            return NextResponse.json({ error: "Missing targetUserId or reason" }, { status: 400 });
        }

        const adminUser = await prisma.user.findUnique({
            where: { email: session!.user.email! }
        });
        if (!adminUser) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId }
        });
        if (!targetUser) return NextResponse.json({ error: "Target user not found" }, { status: 404 });

        if (targetUser.role !== 'BANNED') {
            return NextResponse.json({ error: "User is not banned" }, { status: 400 });
        }

        // Restore previous role (default to USER if no previous role stored)
        const restoredRole = targetUser.previousRole || 'USER';

        await prisma.user.update({
            where: { id: targetUserId },
            data: {
                role: restoredRole,
                previousRole: null
            }
        });

        // Write audit log
        await logAdminAction(
            adminUser.id,
            "unban_user",
            targetUserId,
            reason,
            { targetEmail: targetUser.email, restoredRole }
        );

        return NextResponse.json({
            success: true,
            message: `User ${targetUserId} unbanned, role restored to ${restoredRole}`
        });

    } catch (error) {
        console.error("Admin unban error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
