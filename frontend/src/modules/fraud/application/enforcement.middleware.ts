// ─── Enforcement Middleware ──────────────────────────────────────────────
// Synchronous tier check at request time. O(1) DB read.
// Call this at the top of any API route that needs risk-gating.
//
// This does NOT compute the URS — it reads the PRE-COMPUTED tier from
// risk_scores table (updated asynchronously by the scoring engine).

import { prisma } from "@/lib/prisma";
import { getFeatureGate, type FeatureName, type RiskTier } from "../domain/risk-tiers";
import { checkVelocity, type VelocityCheckResult } from "../infrastructure/velocity-counter";
import { NextResponse } from "next/server";

export interface EnforcementResult {
    allowed: boolean;
    tier: RiskTier;
    dailyLimit?: number;
    requiresApproval?: boolean;
    velocityResult?: VelocityCheckResult;
    reason?: string;
}

/**
 * Check if a user can perform an action given their risk tier and velocity.
 * Returns an EnforcementResult. If not allowed, returns a NextResponse.
 *
 * Usage:
 *   const check = await enforceRiskGate(userId, "SEND_OFFER", "OFFER_SEND");
 *   if (!check.allowed) return check.response!;
 */
export async function enforceRiskGate(
    userId: string,
    feature: FeatureName,
    velocityAction?: string,
): Promise<EnforcementResult & { response?: NextResponse }> {

    // (1) Read pre-computed risk tier — O(1) indexed read
    const riskScore = await prisma.riskScore.findUnique({
        where: { userId },
        select: { tier: true, urs: true, whitelistedUntil: true },
    });

    const tier = (riskScore?.tier as RiskTier) || "GREEN";

    // (2) Check whitelist — if active, treat as GREEN
    const effectiveTier = riskScore?.whitelistedUntil && riskScore.whitelistedUntil > new Date()
        ? "GREEN"
        : tier;

    // (3) Feature gate check
    const gate = getFeatureGate(effectiveTier, feature);

    if (!gate.allowed) {
        return {
            allowed: false,
            tier: effectiveTier,
            reason: gate.reason || "Bu özellik hesabınız için kısıtlandı",
            response: NextResponse.json({
                error: "RISK_BLOCKED",
                message: gate.reason || "Bu özellik hesabınız için kısıtlandı",
                tier: effectiveTier,
            }, { status: 403 }),
        };
    }

    // (4) Velocity check (if applicable)
    let velocityResult: VelocityCheckResult | undefined;
    if (velocityAction) {
        velocityResult = checkVelocity(userId, velocityAction);

        if (velocityResult.response === "BLOCK") {
            return {
                allowed: false,
                tier: effectiveTier,
                velocityResult,
                reason: `Hız limiti aşıldı. ${velocityResult.retryAfterSeconds}s sonra tekrar deneyin.`,
                response: NextResponse.json({
                    error: "VELOCITY_LIMIT",
                    message: "Çok hızlı işlem yapıyorsunuz",
                    retryAfterSeconds: velocityResult.retryAfterSeconds,
                    limit: velocityResult.limit,
                    windowSeconds: velocityResult.windowSeconds,
                }, { status: 429 }),
            };
        }

        if (velocityResult.response === "THROTTLE") {
            // Log but allow (with warning header)
            console.warn(`[Fraud] Velocity THROTTLE for user ${userId}, action ${velocityAction}: ${velocityResult.currentCount}/${velocityResult.limit}`);
        }
    }

    return {
        allowed: true,
        tier: effectiveTier,
        dailyLimit: gate.dailyLimit,
        requiresApproval: gate.requiresApproval,
        velocityResult,
    };
}

/**
 * Quick tier-only check (no velocity, no NextResponse).
 * For conditional UI rendering or non-blocking checks.
 */
export async function getUserRiskTier(userId: string): Promise<RiskTier> {
    const riskScore = await prisma.riskScore.findUnique({
        where: { userId },
        select: { tier: true, whitelistedUntil: true },
    });

    if (riskScore?.whitelistedUntil && riskScore.whitelistedUntil > new Date()) {
        return "GREEN";
    }

    return (riskScore?.tier as RiskTier) || "GREEN";
}
