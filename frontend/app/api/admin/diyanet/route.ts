import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { safeErrorMessage } from "@/lib/safe-error";

/**
 * GET /api/admin/diyanet
 * List all Diyanet applications. Admin only.
 * Query: ?status=PENDING&page=1&limit=20
 */
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "PENDING";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

        const [applications, total] = await Promise.all([
            prisma.diyanetApplication.findMany({
                where: { status },
                orderBy: { createdAt: "asc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            fullName: true,
                            phone: true,
                            photo: true,
                            role: true,
                            packageType: true,
                            trustScore: true,
                            completedTrips: true,
                            createdAt: true,
                        },
                    },
                },
            }),
            prisma.diyanetApplication.count({ where: { status } }),
        ]);

        return NextResponse.json({
            applications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/diyanet
 * Approve or reject a Diyanet application. Admin only.
 *
 * Body: { applicationId, action: "approve" | "reject" | "revoke", reason? }
 */
export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { applicationId, action, reason } = await req.json();

        if (!applicationId || !action) {
            return NextResponse.json({ error: "Missing applicationId or action" }, { status: 400 });
        }
        if (!["approve", "reject", "revoke"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
        if ((action === "reject" || action === "revoke") && !reason?.trim()) {
            return NextResponse.json({ error: "Reason required for rejection/revocation" }, { status: 400 });
        }

        // Find application
        const application = await prisma.diyanetApplication.findUnique({
            where: { id: applicationId },
            include: { user: { select: { id: true, email: true, packageType: true } } },
        });
        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const adminUser = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true },
        });
        if (!adminUser) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

        // ── APPROVE ─────────────────────────────────────────────────
        if (action === "approve") {
            if (application.status !== "PENDING") {
                return NextResponse.json({ error: "Can only approve PENDING applications" }, { status: 400 });
            }

            // Verify user still has a paid packageType
            if (application.user.packageType === "FREE") {
                return NextResponse.json({
                    error: "User no longer has a paid packageType. Cannot approve.",
                }, { status: 400 });
            }

            const updateResult = await prisma.diyanetApplication.updateMany({
                where: { id: applicationId, status: "PENDING" },
                data: {
                    status: "APPROVED",
                    reviewedBy: adminUser.id,
                    reviewedAt: new Date(),
                },
            });

            if (updateResult.count === 0) {
                return NextResponse.json({ error: "Application is not pending or already processed." }, { status: 409 });
            }

            await prisma.$transaction([
                prisma.user.update({
                    where: { id: application.userId },
                    data: { isIdentityVerifiedVerified: true },
                }),
                prisma.adminAuditLog.create({
                    data: {
                        adminId: adminUser.id,
                        action: "approve_diyanet",
                        targetId: application.userId,
                        reason: "Diyanet badge approved",
                    },
                }),
            ]);

            return NextResponse.json({ success: true, message: "Badge approved" });
        }

        // ── REJECT ──────────────────────────────────────────────────
        if (action === "reject") {
            if (application.status !== "PENDING") {
                return NextResponse.json({ error: "Can only reject PENDING applications" }, { status: 400 });
            }

            const updateResult = await prisma.diyanetApplication.updateMany({
                where: { id: applicationId, status: "PENDING" },
                data: {
                    status: "REJECTED",
                    reviewedBy: adminUser.id,
                    reviewedAt: new Date(),
                    rejectionReason: reason.trim(),
                },
            });

            if (updateResult.count === 0) {
                return NextResponse.json({ error: "Application is not pending or already processed." }, { status: 409 });
            }

            await prisma.adminAuditLog.create({
                data: {
                    adminId: adminUser.id,
                    action: "reject_diyanet",
                    targetId: application.userId,
                    reason: reason.trim(),
                },
            });

            return NextResponse.json({ success: true, message: "Badge rejected" });
        }

        // ── REVOKE ──────────────────────────────────────────────────
        if (action === "revoke") {
            if (application.status !== "APPROVED") {
                return NextResponse.json({ error: "Can only revoke APPROVED applications" }, { status: 400 });
            }

            const updateResult = await prisma.diyanetApplication.updateMany({
                where: { id: applicationId, status: "APPROVED" },
                data: {
                    status: "REVOKED",
                    revokedReason: reason.trim(),
                },
            });

            if (updateResult.count === 0) {
                return NextResponse.json({ error: "Application is not approved or already revoked." }, { status: 409 });
            }

            await prisma.$transaction([
                prisma.user.update({
                    where: { id: application.userId },
                    data: { isIdentityVerifiedVerified: false },
                }),
                prisma.adminAuditLog.create({
                    data: {
                        adminId: adminUser.id,
                        action: "revoke_diyanet",
                        targetId: application.userId,
                        reason: reason.trim(),
                    },
                }),
            ]);

            return NextResponse.json({ success: true, message: "Badge revoked" });
        }

    } catch (error) {
        console.error("Admin diyanet error:", error);
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
    }
}
