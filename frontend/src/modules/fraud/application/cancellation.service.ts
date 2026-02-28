// ─── Cancellation Penalty Service ────────────────────────────────────────
// Computes cancellation severity tiers, applies trust penalties,
// and records cancellation events.

import { prisma } from "@/lib/prisma";

// ─── Severity Tiers ─────────────────────────────────────────────────────

export type CancellationSeverity = "FREE" | "SOFT" | "MODERATE" | "SEVERE" | "CRITICAL" | "NO_SHOW";

interface SeverityTier {
    severity: CancellationSeverity;
    agencyPenalty: number;
    userPenalty: number;
    additionalEffect?: string;
}

const SEVERITY_TIERS: { minDays: number; tier: SeverityTier }[] = [
    { minDays: 30, tier: { severity: "FREE", agencyPenalty: 0, userPenalty: 0 } },
    { minDays: 15, tier: { severity: "SOFT", agencyPenalty: 3, userPenalty: 0 } },
    { minDays: 7, tier: { severity: "MODERATE", agencyPenalty: 7, userPenalty: 0, additionalEffect: "listings_deprioritized_48h" } },
    { minDays: 3, tier: { severity: "SEVERE", agencyPenalty: 12, userPenalty: 2, additionalEffect: "boost_blocked_7d" } },
    { minDays: 0, tier: { severity: "CRITICAL", agencyPenalty: 20, userPenalty: 5, additionalEffect: "listings_hidden_72h" } },
];

const NO_SHOW_TIER: SeverityTier = {
    severity: "NO_SHOW",
    agencyPenalty: 25,
    userPenalty: 10,
    additionalEffect: "auto_escalation",
};

// ─── Frequency Multiplier ───────────────────────────────────────────────

async function getFrequencyMultiplier(userId: string): Promise<number> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000);
    const recentCount = await prisma.cancellationRecord.count({
        where: {
            userId,
            createdAt: { gte: ninetyDaysAgo },
            isForceMajeure: false,
        },
    });

    if (recentCount === 0) return 1.0;
    if (recentCount === 1) return 1.5;
    if (recentCount === 2) return 2.5;
    return 3.0; // 3rd+ cancellation in 90 days
}

// ─── Public API ─────────────────────────────────────────────────────────

export interface CancellationInput {
    userId: string;           // Who is cancelling
    counterpartyId: string;   // Affected party
    cancelledBy: "AGENCY" | "USER" | "SYSTEM";
    requestId?: string;
    listingId?: string;
    departureDate: Date;
    reason?: string;
    isForceMajeure?: boolean;
    isNoShow?: boolean;
}

export interface CancellationResult {
    severity: CancellationSeverity;
    trustPenalty: number;
    frequencyMultiplier: number;
    additionalEffect?: string;
    recordId: string;
}

/**
 * Process a cancellation event.
 * Computes severity, applies trust penalty, and records the event.
 */
export async function processCancellation(input: CancellationInput): Promise<CancellationResult> {
    // Force majeure → zero penalty
    if (input.isForceMajeure) {
        const record = await prisma.cancellationRecord.create({
            data: {
                userId: input.userId,
                counterpartyId: input.counterpartyId,
                requestId: input.requestId,
                listingId: input.listingId,
                cancelledBy: input.cancelledBy,
                reason: input.reason,
                severity: "FREE",
                daysBeforeDeparture: null,
                trustPenalty: 0,
                isForceMajeure: true,
            },
        });

        return {
            severity: "FREE",
            trustPenalty: 0,
            frequencyMultiplier: 1.0,
            recordId: record.id,
        };
    }

    // Compute days before departure
    const now = Date.now();
    const daysBeforeDeparture = Math.max(0, Math.floor((input.departureDate.getTime() - now) / 86_400_000));

    // Determine severity tier
    let tier: SeverityTier;
    if (input.isNoShow) {
        tier = NO_SHOW_TIER;
    } else {
        const matched = SEVERITY_TIERS.find(t => daysBeforeDeparture >= t.minDays);
        tier = matched?.tier ?? SEVERITY_TIERS[SEVERITY_TIERS.length - 1].tier;
    }

    // Get frequency multiplier
    const frequencyMultiplier = await getFrequencyMultiplier(input.userId);

    // Compute actual penalty (base × frequency)
    const basePenalty = input.cancelledBy === "AGENCY" ? tier.agencyPenalty : tier.userPenalty;
    const trustPenalty = Math.round(basePenalty * frequencyMultiplier);

    // Cold-start protection: no penalty if < 3 completed trips
    const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { completedTrips: true, trustScore: true },
    });

    const effectivePenalty = (user?.completedTrips ?? 0) < 3 ? 0 : trustPenalty;

    // Record cancellation
    const record = await prisma.cancellationRecord.create({
        data: {
            userId: input.userId,
            counterpartyId: input.counterpartyId,
            requestId: input.requestId,
            listingId: input.listingId,
            cancelledBy: input.cancelledBy,
            reason: input.reason,
            severity: tier.severity,
            daysBeforeDeparture,
            trustPenalty: effectivePenalty,
            isForceMajeure: false,
        },
    });

    // Apply trust penalty
    if (effectivePenalty > 0 && user) {
        const newScore = Math.max(0, user.trustScore - effectivePenalty);
        await prisma.user.update({
            where: { id: input.userId },
            data: { trustScore: newScore },
        });

        // Log trust change
        await prisma.riskEvent.create({
            data: {
                userId: input.userId,
                eventType: "TRUST_CHANGE",
                severity: effectivePenalty >= 15 ? "HIGH" : "MEDIUM",
                metadata: {
                    previous: user.trustScore,
                    new: newScore,
                    delta: -effectivePenalty,
                    reason: "CANCELLATION_PENALTY",
                    severity: tier.severity,
                    frequencyMultiplier,
                    daysBeforeDeparture,
                },
            },
        });
    }

    // Auto-escalation for NO_SHOW or 4+ cancellations
    if (tier.severity === "NO_SHOW" || frequencyMultiplier >= 3.0) {
        await prisma.riskEvent.create({
            data: {
                userId: input.userId,
                eventType: "CANCELLATION_ESCALATION",
                severity: "HIGH",
                metadata: {
                    severity: tier.severity,
                    frequencyMultiplier,
                    recordId: record.id,
                },
            },
        });
    }

    return {
        severity: tier.severity,
        trustPenalty: effectivePenalty,
        frequencyMultiplier,
        additionalEffect: tier.additionalEffect,
        recordId: record.id,
    };
}
