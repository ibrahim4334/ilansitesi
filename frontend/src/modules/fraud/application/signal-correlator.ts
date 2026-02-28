// ─── Cross-Signal Correlation Engine ────────────────────────────────────
// Detects multi-vector attack chains by correlating disparate risk events.
// No complex event processing — lightweight windowed aggregation.
//
// Fires on each new RiskEvent (event-driven, not batched).
// Detects:
//   Chain A: Sybil → Trust farming → Review manipulation
//   Chain B: Sybil → Cancellation weaponization
//   Chain C: Repeated probation recycling

import { prisma } from "@/lib/prisma";

// ─── Signal Weights ─────────────────────────────────────────────────────

const SIGNAL_WEIGHTS: Record<string, number> = {
    "TRUST_CHANGE": 1,
    "SLA_VIOLATION": 2,
    "REVIEW_CLUSTER": 3,
    "REVIEW_CONCENTRATION_ALERT": 5,
    "SYBIL_DETECTED": 8,
    "SYBIL_REGISTRATION_CHECK": 4,
    "CANCELLATION_ESCALATION": 3,
    "BEHAVIORAL_ANOMALY": 4,
    "BOOST_ABUSE": 4,
};

// ─── Correlation Result ─────────────────────────────────────────────────

export interface CorrelationResult {
    compositeScore: number;
    chainDetected: string | null;
    action: "NONE" | "URS_BUMP" | "TIER_ESCALATE" | "AUTO_ESCALATION";
    details: {
        eventCount: number;
        uniqueTypes: number;
        window: string;
    };
}

// ─── Main Correlator ────────────────────────────────────────────────────

/**
 * Correlate all risk signals for a user within a 7-day window.
 * Call AFTER creating a new RiskEvent.
 *
 * Runtime: single indexed query (~50-100 events) → <5ms.
 */
export async function correlateSignals(userId: string): Promise<CorrelationResult> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

    const events = await prisma.riskEvent.findMany({
        where: {
            userId,
            createdAt: { gte: sevenDaysAgo },
        },
        select: {
            eventType: true,
            severity: true,
            createdAt: true,
            metadata: true,
        },
        orderBy: { createdAt: "asc" },
    });

    if (events.length < 2) {
        return {
            compositeScore: 0,
            chainDetected: null,
            action: "NONE",
            details: { eventCount: events.length, uniqueTypes: 0, window: "7d" },
        };
    }

    // Weighted composite score
    const compositeScore = events.reduce((sum, e) => {
        const weight = SIGNAL_WEIGHTS[e.eventType] ?? 1;
        const severityMult = e.severity === "HIGH" ? 2 : e.severity === "MEDIUM" ? 1.5 : 1;
        return sum + weight * severityMult;
    }, 0);

    // Unique event types
    const types = new Set(events.map(e => e.eventType));

    // Chain detection
    const chainDetected = detectAttackChains(types, events);

    // Determine action based on composite score
    let action: CorrelationResult["action"] = "NONE";
    if (compositeScore > 40 || chainDetected) {
        action = "AUTO_ESCALATION";
    } else if (compositeScore > 20) {
        action = "TIER_ESCALATE";
    } else if (compositeScore > 10) {
        action = "URS_BUMP";
    }

    // Execute action
    if (action !== "NONE") {
        await executeCorrelationAction(userId, action, compositeScore, chainDetected);
    }

    return {
        compositeScore,
        chainDetected,
        action,
        details: {
            eventCount: events.length,
            uniqueTypes: types.size,
            window: "7d",
        },
    };
}

// ─── Chain Detection ────────────────────────────────────────────────────

function detectAttackChains(
    types: Set<string>,
    events: { eventType: string; metadata: any }[],
): string | null {
    // Chain A: Sybil → Trust farming → Review manipulation
    // Most dangerous: complete ranking takeover
    if (
        (types.has("SYBIL_REGISTRATION_CHECK") || types.has("SYBIL_DETECTED")) &&
        types.has("TRUST_CHANGE") &&
        (types.has("REVIEW_CLUSTER") || types.has("REVIEW_CONCENTRATION_ALERT"))
    ) {
        return "CHAIN_A_RANKING_TAKEOVER";
    }

    // Chain B: Sybil → Cancellation weaponization
    if (
        (types.has("SYBIL_DETECTED") || types.has("BEHAVIORAL_ANOMALY")) &&
        types.has("CANCELLATION_ESCALATION")
    ) {
        return "CHAIN_B_COMPETITOR_DESTRUCTION";
    }

    // Chain C: Repeated probation cycling
    const ticketResolutions = events.filter(e => e.eventType === "TICKET_RESOLVED");
    if (ticketResolutions.length >= 3) {
        return "CHAIN_C_PROBATION_RECYCLING";
    }

    // Chain D: Boost abuse + review farming (Pay-to-win)
    if (
        types.has("BOOST_ABUSE") &&
        (types.has("REVIEW_CLUSTER") || types.has("REVIEW_CONCENTRATION_ALERT"))
    ) {
        return "CHAIN_D_PAY_TO_WIN";
    }

    return null;
}

// ─── Action Execution ───────────────────────────────────────────────────

async function executeCorrelationAction(
    userId: string,
    action: CorrelationResult["action"],
    compositeScore: number,
    chainDetected: string | null,
): Promise<void> {
    if (action === "URS_BUMP") {
        // Increase URS by 5 (soft escalation)
        await prisma.riskScore.updateMany({
            where: { userId },
            data: { urs: { increment: 5 } },
        });
    }

    if (action === "TIER_ESCALATE") {
        // Bump tier one level
        const risk = await prisma.riskScore.findUnique({
            where: { userId },
            select: { tier: true, urs: true },
        });

        if (risk) {
            const tierOrder = ["GREEN", "YELLOW", "ORANGE", "RED", "BLACK"];
            const currentIdx = tierOrder.indexOf(risk.tier);
            const nextTier = tierOrder[Math.min(currentIdx + 1, tierOrder.length - 1)];

            await prisma.riskScore.update({
                where: { userId },
                data: {
                    tier: nextTier,
                    urs: { increment: 10 },
                },
            });
        }
    }

    if (action === "AUTO_ESCALATION") {
        // Create escalation ticket + bump to RED minimum
        await prisma.riskScore.updateMany({
            where: { userId, tier: { in: ["GREEN", "YELLOW", "ORANGE"] } },
            data: { tier: "RED", urs: { increment: 20 } },
        });
    }

    // Always log the correlation event
    await prisma.riskEvent.create({
        data: {
            userId,
            eventType: "CROSS_SIGNAL_CORRELATION",
            severity: action === "AUTO_ESCALATION" ? "HIGH" : "MEDIUM",
            metadata: {
                compositeScore,
                chainDetected,
                action,
            },
        },
    });
}
