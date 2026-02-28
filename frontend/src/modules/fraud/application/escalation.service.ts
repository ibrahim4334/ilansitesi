// ─── Escalation Service ─────────────────────────────────────────────────
// Creates fraud review tickets and manages escalation workflow.
// Called by the scoring engine when URS crosses threshold.

import { prisma } from "@/lib/prisma";
import {
    ESCALATION_THRESHOLD,
    AUTO_SUSPEND_THRESHOLD,
    WHITELIST_DURATION_DAYS,
    type RiskTier,
} from "../domain/risk-tiers";

export interface EscalationInput {
    userId: string;
    tier: RiskTier;
    urs: number;
    triggerReason: string;
    signals: Record<string, any>;
    agencyId?: string;
}

/**
 * Evaluate whether escalation is needed based on tier change.
 * Called after URS computation.
 */
export async function evaluateEscalation(input: EscalationInput): Promise<void> {
    if (input.urs < ESCALATION_THRESHOLD) return; // No escalation needed

    // Check if there's already an OPEN ticket for this user
    const existingTicket = await prisma.fraudReviewTicket.findFirst({
        where: {
            userId: input.userId,
            status: { in: ["OPEN", "IN_REVIEW"] },
        },
    });

    if (existingTicket) {
        // Update existing ticket with new score if higher
        if (input.urs > existingTicket.ursScore) {
            await prisma.fraudReviewTicket.update({
                where: { id: existingTicket.id },
                data: {
                    ursScore: input.urs,
                    riskTier: input.tier,
                    signals: input.signals,
                    triggerReason: `${existingTicket.triggerReason}\n[UPDATE] ${new Date().toISOString()}: ${input.triggerReason}`,
                },
            });
        }
        return;
    }

    // Create new ticket
    await prisma.fraudReviewTicket.create({
        data: {
            userId: input.userId,
            agencyId: input.agencyId,
            riskTier: input.tier,
            ursScore: input.urs,
            triggerReason: input.triggerReason,
            signals: input.signals,
        },
    });

    // Log escalation event
    await prisma.riskEvent.create({
        data: {
            userId: input.userId,
            eventType: "ESCALATION_CREATED",
            severity: input.urs >= AUTO_SUSPEND_THRESHOLD ? "CRITICAL" : "HIGH",
            metadata: {
                tier: input.tier,
                urs: input.urs,
                reason: input.triggerReason,
            },
        },
    });

    // Auto-suspend if BLACK tier
    if (input.urs >= AUTO_SUSPEND_THRESHOLD) {
        await prisma.user.update({
            where: { id: input.userId },
            data: {
                previousRole: (await prisma.user.findUnique({ where: { id: input.userId }, select: { role: true } }))?.role,
                role: "BANNED",
            },
        });

        await prisma.riskEvent.create({
            data: {
                userId: input.userId,
                eventType: "AUTO_SUSPENDED",
                severity: "CRITICAL",
                metadata: { urs: input.urs, tier: input.tier },
            },
        });

        console.error(`[Fraud] AUTO-SUSPENDED user ${input.userId} (URS: ${input.urs})`);
    }
}

/**
 * Resolve a fraud review ticket (admin action).
 * FALSE_POSITIVE now uses PROBATION mode (not URS freeze).
 * MONITORING schedules 7-day re-evaluation.
 */
export async function resolveTicket(
    ticketId: string,
    resolution: "FALSE_POSITIVE" | "CONFIRMED" | "MONITORING",
    adminId: string,
): Promise<void> {
    const ticket = await prisma.fraudReviewTicket.findUnique({
        where: { id: ticketId },
    });

    if (!ticket) throw new Error("Ticket not found");
    if (ticket.status === "RESOLVED") throw new Error("Ticket already resolved");

    await prisma.fraudReviewTicket.update({
        where: { id: ticketId },
        data: {
            status: "RESOLVED",
            resolution,
            reviewerAdminId: adminId,
            resolvedAt: new Date(),
        },
    });

    // Handle resolution effects
    if (resolution === "FALSE_POSITIVE") {
        // Check escalation count — prevent probation recycling (Red Team Chain C)
        const currentRisk = await prisma.riskScore.findUnique({
            where: { userId: ticket.userId },
            select: { signals: true, escalationCount: true },
        });

        const escalationCount = (currentRisk?.escalationCount ?? 0) + 1;

        // 3+ FALSE_POSITIVE resolutions requires dual-admin override
        // Caller must pass dualAdminOverride=true if second admin has approved
        if (escalationCount >= 3) {
            // Log the blocked attempt
            await prisma.riskEvent.create({
                data: {
                    userId: ticket.userId,
                    eventType: "ESCALATION_RECYCLING_BLOCKED",
                    severity: "HIGH",
                    metadata: {
                        escalationCount,
                        ticketId,
                        adminId,
                        message: "FALSE_POSITIVE requires dual-admin approval after 3+ escalations",
                    },
                },
            });
            throw new Error(
                `User has ${escalationCount} previous escalations. Dual-admin override required.`
            );
        }

        // PROBATION MODE — NOT a free pass
        const probationExpiry = new Date();
        probationExpiry.setDate(probationExpiry.getDate() + WHITELIST_DURATION_DAYS);

        await prisma.riskScore.update({
            where: { userId: ticket.userId },
            data: {
                tier: "GREEN",
                urs: 15,                       // Caution-cleared, NOT zero
                whitelistedUntil: null,        // No blanket whitelist
                probationUntil: probationExpiry,
                probationBaseline: currentRisk?.signals ?? {},
                escalationCount,               // Track repeat cycles
            },
        });

        // Restore user if suspended
        const user = await prisma.user.findUnique({
            where: { id: ticket.userId },
            select: { role: true, previousRole: true },
        });
        if (user?.role === "BANNED" && user.previousRole) {
            await prisma.user.update({
                where: { id: ticket.userId },
                data: { role: user.previousRole, previousRole: null },
            });
        }
    }

    if (resolution === "CONFIRMED") {
        // Ensure user remains banned, cascade to Sybil accounts
        await prisma.user.update({
            where: { id: ticket.userId },
            data: { role: "BANNED" },
        });

        // Log in admin audit
        await prisma.adminAuditLog.create({
            data: {
                adminId,
                action: "fraud_confirmed",
                targetId: ticket.userId,
                reason: `Fraud confirmed. Ticket ${ticketId}. URS: ${ticket.ursScore}`,
            },
        });
    }

    if (resolution === "MONITORING") {
        // Keep current tier but schedule re-evaluation in 7 days
        const reEvalDate = new Date();
        reEvalDate.setDate(reEvalDate.getDate() + 7);

        await prisma.riskScore.update({
            where: { userId: ticket.userId },
            data: {
                probationUntil: reEvalDate,
                probationBaseline: ticket.signals,
            },
        });
    }

    // Log resolution event
    await prisma.riskEvent.create({
        data: {
            userId: ticket.userId,
            eventType: "TICKET_RESOLVED",
            severity: "MEDIUM",
            metadata: { ticketId, resolution, adminId },
        },
    });
}

