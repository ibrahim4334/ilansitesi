import { prisma } from "@/lib/prisma";

/**
 * Log every admin action to admin_audit_logs table.
 * This is MANDATORY for all admin operations.
 */
export async function logAdminAction(
    adminId: string,
    action: string,
    targetId: string,
    reason: string,
    metadata?: Record<string, any>
): Promise<void> {
    await prisma.adminAuditLog.create({
        data: {
            adminId,
            action,
            targetId,
            reason,
            metadata: metadata || undefined,
        }
    });

    console.log(`[ADMIN AUDIT] ${action} on ${targetId} by ${adminId}: ${reason}`);
}
