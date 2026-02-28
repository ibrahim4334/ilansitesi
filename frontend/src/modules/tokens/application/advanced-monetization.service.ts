// ─── Advanced Monetization Engine ───────────────────────────────────────
// Four-pillar monetization layer:
//   1. Dynamic Token Pricing (demand-based surge + loyalty discounts)
//   2. Performance-Based Tiers (revenue-linked token discounts)
//   3. Enterprise Credit Lines (post-paid billing for CORP tiers)
//   4. Smart Bundling (auto-suggest optimal plan based on usage)
//
// Architecture: Pure functions + Prisma data layer + EventBus signaling.
// All pricing is deterministic (no randomness), auditable, and reversible.

import { prisma } from "@/lib/prisma";
import { TOKEN_COSTS, PLAN_PRICES_TRY, PACKAGE_LIMITS } from "@/lib/package-system";
import type { PackageType } from "@/lib/db-types";
import { EventBus } from "@/src/core/events/event-bus";

// ═══════════════════════════════════════════════════════════════════════
// PILLAR 1: DYNAMIC TOKEN PRICING
// ═══════════════════════════════════════════════════════════════════════

/**
 * Surge pricing tiers:
 *   NONE:        1.0×  (normal hours, low demand)
 *   PEAK_HOUR:   1.25× (09:00–12:00, 18:00–21:00 TR time)
 *   HIGH_DEMAND: 1.50× (>80% boost slots used in city within 1h)
 *   SEASONAL:    1.75× (Hajj/Umrah peak months: Dhul Hijjah, Ramadan)
 *
 * Discount tiers:
 *   OFF_PEAK:    0.80× (02:00–06:00 TR time)
 *   LOYALTY:     0.90× (>6 months consecutive paid subscription)
 *   BUNDLE:      0.85× (>100 tokens purchased this month)
 */

export interface DynamicPriceResult {
    baseCost: number;
    finalCost: number;
    multiplier: number;
    surgeReason: "PEAK_HOUR" | "HIGH_DEMAND" | "SEASONAL" | "NONE";
    discountApplied: "LOYALTY" | "BUNDLE" | "OFF_PEAK" | null;
    savings: number;
}

const SURGE_MULTIPLIERS = {
    NONE: 1.0,
    PEAK_HOUR: 1.25,
    HIGH_DEMAND: 1.50,
    SEASONAL: 1.75,
} as const;

const DISCOUNT_MULTIPLIERS = {
    OFF_PEAK: 0.80,
    LOYALTY: 0.90,
    BUNDLE: 0.85,
} as const;

// Hard ceiling: never exceed 2.5× base cost (consumer protection)
const MAX_MULTIPLIER = 2.50;
// Hard floor: never go below 0.70× base cost (revenue protection)
const MIN_MULTIPLIER = 0.70;

/**
 * Calculate dynamic price for a token action.
 * Pure function: deterministic output for same inputs.
 */
export function calculateDynamicPrice(
    action: keyof typeof TOKEN_COSTS,
    context: {
        hourTR: number;          // Current hour in TR timezone (0–23)
        monthIndex: number;      // 0–11
        cityBoostUtilization: number; // 0.0–1.0 (% of boost slots used)
        userSubscriptionMonths: number; // Consecutive paid months
        userMonthlyTokensPurchased: number; // Tokens bought this month
        performanceDiscount: number;  // From performance tier (0.0–0.15)
    },
): DynamicPriceResult {
    const baseCost = TOKEN_COSTS[action];

    // ── 1. Determine surge ──────────────────────────────────────────
    let surgeReason: keyof typeof SURGE_MULTIPLIERS = "NONE";
    let surgeMultiplier = 1.0;

    // Seasonal check: Ramadan (~month 2-3 in Islamic calendar, approximate)
    // and Hajj (~month 11 Dhul Hijjah). Simplified: June–August + Ramadan period.
    const isSeasonalPeak = [5, 6, 7, 11].includes(context.monthIndex); // Jun,Jul,Aug,Dec
    if (isSeasonalPeak) {
        surgeReason = "SEASONAL";
        surgeMultiplier = SURGE_MULTIPLIERS.SEASONAL;
    }

    // High demand override (if city is heavily boosted right now)
    if (context.cityBoostUtilization > 0.80) {
        surgeReason = "HIGH_DEMAND";
        surgeMultiplier = Math.max(surgeMultiplier, SURGE_MULTIPLIERS.HIGH_DEMAND);
    }

    // Peak hour (only if no stronger surge)
    if (surgeMultiplier < SURGE_MULTIPLIERS.PEAK_HOUR) {
        const isPeakHour = (context.hourTR >= 9 && context.hourTR <= 12) ||
            (context.hourTR >= 18 && context.hourTR <= 21);
        if (isPeakHour) {
            surgeReason = "PEAK_HOUR";
            surgeMultiplier = SURGE_MULTIPLIERS.PEAK_HOUR;
        }
    }

    // ── 2. Determine discount ───────────────────────────────────────
    let discountApplied: keyof typeof DISCOUNT_MULTIPLIERS | null = null;
    let discountMultiplier = 1.0;

    // Off-peak (02:00–06:00 TR) — strongest discount
    const isOffPeak = context.hourTR >= 2 && context.hourTR <= 6;
    if (isOffPeak && surgeReason === "NONE") {
        discountApplied = "OFF_PEAK";
        discountMultiplier = DISCOUNT_MULTIPLIERS.OFF_PEAK;
    }

    // Loyalty discount (>6 months consecutive paid)
    if (context.userSubscriptionMonths >= 6 && !discountApplied) {
        discountApplied = "LOYALTY";
        discountMultiplier = DISCOUNT_MULTIPLIERS.LOYALTY;
    }

    // Bundle discount (>100 tokens purchased this month)
    if (context.userMonthlyTokensPurchased >= 100 && !discountApplied) {
        discountApplied = "BUNDLE";
        discountMultiplier = DISCOUNT_MULTIPLIERS.BUNDLE;
    }

    // ── 3. Performance tier discount (stacks with others) ───────────
    const perfMultiplier = 1.0 - context.performanceDiscount;

    // ── 4. Compute final multiplier with caps ───────────────────────
    let finalMultiplier = surgeMultiplier * discountMultiplier * perfMultiplier;
    finalMultiplier = Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, finalMultiplier));

    const finalCost = Math.max(1, Math.round(baseCost * finalMultiplier));

    return {
        baseCost,
        finalCost,
        multiplier: Math.round(finalMultiplier * 100) / 100,
        surgeReason,
        discountApplied,
        savings: baseCost - finalCost,
    };
}

// ═══════════════════════════════════════════════════════════════════════
// PILLAR 2: PERFORMANCE-BASED TIERS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Performance tiers: reward high-performing agencies with token discounts.
 *
 * BRONZE: 0% discount (default, new agencies)
 * SILVER: 5% discount (moderate performers)
 * GOLD:   10% discount (high performers)
 * PLATINUM: 15% discount (top performers)
 */

export const PERFORMANCE_TIERS = {
    BRONZE: { minScore: 0, discountPercent: 0, bonusTokens: 0 },
    SILVER: { minScore: 40, discountPercent: 5, bonusTokens: 5 },
    GOLD: { minScore: 65, discountPercent: 10, bonusTokens: 15 },
    PLATINUM: { minScore: 85, discountPercent: 15, bonusTokens: 30 },
} as const;

export type PerformanceTierName = keyof typeof PERFORMANCE_TIERS;

/**
 * Calculate composite performance score.
 * Evaluated daily by cron for all paid agencies.
 *
 * CompositeScore = (Revenue×0.35 + Conversion×0.35 + Response×0.30) × 100
 */
export function calculatePerformanceScore(metrics: {
    monthlyRevenue30d: number;  // GMV in TRY (pass-through bookings)
    conversionRate30d: number;  // offer→booking ratio (0.0–1.0)
    responseScore30d: number;   // SLA adherence (0.0–1.0)
}): { score: number; tier: PerformanceTierName; discount: number; bonus: number } {
    // Normalize revenue: ₺0 = 0.0, ₺50K+ = 1.0 (logarithmic)
    const revNorm = Math.min(1.0, Math.log10(Math.max(metrics.monthlyRevenue30d, 1) / 1000 + 1) / Math.log10(51));

    // Composite: weighted average
    const composite = (
        revNorm * 0.35 +
        metrics.conversionRate30d * 0.35 +
        metrics.responseScore30d * 0.30
    ) * 100;

    const score = Math.round(Math.min(100, composite));

    // Determine tier
    let tier: PerformanceTierName = "BRONZE";
    if (score >= PERFORMANCE_TIERS.PLATINUM.minScore) tier = "PLATINUM";
    else if (score >= PERFORMANCE_TIERS.GOLD.minScore) tier = "GOLD";
    else if (score >= PERFORMANCE_TIERS.SILVER.minScore) tier = "SILVER";

    const config = PERFORMANCE_TIERS[tier];

    return {
        score,
        tier,
        discount: config.discountPercent / 100,
        bonus: config.bonusTokens,
    };
}

/**
 * Evaluate and update performance tier for a user.
 * Called by daily cron job.
 */
export async function evaluatePerformanceTier(userId: string): Promise<{
    tier: PerformanceTierName;
    changed: boolean;
    score: number;
}> {
    // Fetch 30-day metrics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const [slaMetrics, conversionData] = await Promise.all([
        // SLA adherence: % of responses under 4 hours
        prisma.sLAMetric.findMany({
            where: { userId, createdAt: { gte: thirtyDaysAgo } },
            select: { valueMs: true },
        }),
        // Conversion: count of offers vs count of completed bookings (approximated)
        prisma.requestInterest.count({
            where: { guideEmail: userId, createdAt: { gte: thirtyDaysAgo } },
        }),
    ]);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { completedTrips: true },
    });

    // Calculate metrics
    const totalSLA = slaMetrics.length;
    const goodSLA = slaMetrics.filter(m => m.valueMs <= 4 * 3600 * 1000).length;
    const responseScore = totalSLA > 0 ? goodSLA / totalSLA : 0.5;

    // Revenue approximation (completedTrips × avg booking value)
    const avgBookingValue = 15000; // ₺15K avg Umrah package
    const monthlyRevenue = (user?.completedTrips || 0) * avgBookingValue / 12;

    // Conversion rate (offers → trips)
    const conversionRate = conversionData > 0
        ? Math.min(1.0, (user?.completedTrips || 0) / conversionData)
        : 0;

    const result = calculatePerformanceScore({
        monthlyRevenue30d: monthlyRevenue,
        conversionRate30d: conversionRate,
        responseScore30d: responseScore,
    });

    // Upsert performance tier
    const existing = await prisma.performanceTier.findUnique({ where: { userId } });
    const previousTier = existing?.currentTier || "BRONZE";
    const changed = previousTier !== result.tier;

    await prisma.performanceTier.upsert({
        where: { userId },
        create: {
            userId,
            currentTier: result.tier,
            monthlyRevenue30d: monthlyRevenue,
            conversionRate30d: conversionRate,
            responseScore30d: responseScore,
            compositeScore: result.score,
            discountPercent: result.discount * 100,
            bonusTokens: result.bonus,
            tierChangedAt: changed ? new Date() : null,
        },
        update: {
            currentTier: result.tier,
            monthlyRevenue30d: monthlyRevenue,
            conversionRate30d: conversionRate,
            responseScore30d: responseScore,
            compositeScore: result.score,
            discountPercent: result.discount * 100,
            bonusTokens: result.bonus,
            lastEvaluatedAt: new Date(),
            tierChangedAt: changed ? new Date() : undefined,
        },
    });

    if (changed) {
        EventBus.emit("PERFORMANCE_TIER_CHANGED", {
            userId,
            from: previousTier,
            to: result.tier,
            score: result.score,
            discount: result.discount,
        });
    }

    return { tier: result.tier, changed, score: result.score };
}

// ═══════════════════════════════════════════════════════════════════════
// PILLAR 3: ENTERPRISE CREDIT LINES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Enterprise credit line: CORP tiers can spend tokens now, pay later.
 *
 * Rules:
 *   CORP_BASIC:      500 token credit line
 *   CORP_PRO:        1,500 token credit line
 *   CORP_ENTERPRISE: 5,000 token credit line
 *
 * Billing: Auto-charge at end of 30-day cycle.
 * Grace: 7 days after billing before DEFAULTED.
 * Default: Freeze account + lose credit access.
 */

const CREDIT_LIMITS: Record<string, number> = {
    CORP_BASIC: 500,
    CORP_PRO: 1500,
    CORP_ENTERPRISE: 5000,
};

export async function openCreditLine(userId: string): Promise<{
    ok: boolean;
    creditLimit: number;
    error?: string;
}> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { packageType: true },
    });

    if (!user) return { ok: false, creditLimit: 0, error: "User not found" };

    const limit = CREDIT_LIMITS[user.packageType];
    if (!limit) return { ok: false, creditLimit: 0, error: "Credit lines only for CORP plans" };

    const existing = await prisma.enterpriseCreditLine.findUnique({
        where: { userId },
    });

    if (existing) {
        return { ok: true, creditLimit: existing.creditLimit };
    }

    const nextBilling = new Date();
    nextBilling.setDate(nextBilling.getDate() + 30);

    await prisma.enterpriseCreditLine.create({
        data: {
            userId,
            creditLimit: limit,
            nextBillingAt: nextBilling,
        },
    });

    return { ok: true, creditLimit: limit };
}

/**
 * Draw tokens from credit line (use now, pay later).
 * Returns tokens to the user's balance via grantToken.
 */
export async function drawCredit(
    userId: string,
    amount: number,
    reason: string,
    idempotencyKey: string,
): Promise<{ ok: boolean; newUsedCredit: number; error?: string }> {
    const creditLine = await prisma.enterpriseCreditLine.findUnique({
        where: { userId },
    });

    if (!creditLine || creditLine.status !== "ACTIVE") {
        return { ok: false, newUsedCredit: 0, error: "No active credit line" };
    }

    if (creditLine.usedCredit + amount > creditLine.creditLimit) {
        return { ok: false, newUsedCredit: creditLine.usedCredit, error: "CREDIT_LIMIT_EXCEEDED" };
    }

    // Atomic update
    const updated = await prisma.enterpriseCreditLine.update({
        where: { userId },
        data: { usedCredit: { increment: amount } },
    });

    // Log transaction
    await prisma.creditLineTransaction.create({
        data: {
            creditLineId: creditLine.id,
            userId,
            type: "DRAW",
            amount,
            balanceBefore: creditLine.usedCredit,
            balanceAfter: updated.usedCredit,
            note: reason,
            idempotencyKey,
        },
    });

    EventBus.emit("CREDIT_LINE_DRAWN", { userId, amount, newUsedCredit: updated.usedCredit });

    return { ok: true, newUsedCredit: updated.usedCredit };
}

/**
 * Process billing cycle for credit line. Called by monthly cron.
 * Charges the usedCredit amount to user's payment method.
 * If payment fails → grace period. If grace expires → DEFAULTED.
 */
export async function processCreditBilling(userId: string): Promise<{
    ok: boolean;
    charged: number;
    error?: string;
}> {
    const creditLine = await prisma.enterpriseCreditLine.findUnique({
        where: { userId },
    });

    if (!creditLine || creditLine.usedCredit === 0) {
        // No balance to charge — just reset the cycle
        if (creditLine) {
            const nextBilling = new Date();
            nextBilling.setDate(nextBilling.getDate() + creditLine.billingCycleDays);
            await prisma.enterpriseCreditLine.update({
                where: { userId },
                data: { nextBillingAt: nextBilling },
            });
        }
        return { ok: true, charged: 0 };
    }

    const chargeAmount = creditLine.usedCredit;

    // TODO: Integrate with payment gateway (Stripe/iyzico)
    // For now: simulate successful charge
    const paymentSuccess = true; // Replace with real payment call

    if (paymentSuccess) {
        const nextBilling = new Date();
        nextBilling.setDate(nextBilling.getDate() + creditLine.billingCycleDays);

        await prisma.enterpriseCreditLine.update({
            where: { userId },
            data: {
                usedCredit: 0,
                nextBillingAt: nextBilling,
                consecutiveLateCount: 0,
            },
        });

        await prisma.creditLineTransaction.create({
            data: {
                creditLineId: creditLine.id,
                userId,
                type: "AUTO_CHARGE",
                amount: chargeAmount,
                balanceBefore: chargeAmount,
                balanceAfter: 0,
                note: `Billing cycle charge: ${chargeAmount} tokens`,
                idempotencyKey: `credit-billing:${userId}:${Date.now()}`,
            },
        });

        EventBus.emit("CREDIT_LINE_REPAID", { userId, amount: chargeAmount });
        return { ok: true, charged: chargeAmount };
    }

    // Payment failed — increment late count
    const newLateCount = creditLine.consecutiveLateCount + 1;
    const isDefaulted = newLateCount >= 2; // 2 missed payments → DEFAULT

    await prisma.enterpriseCreditLine.update({
        where: { userId },
        data: {
            consecutiveLateCount: newLateCount,
            status: isDefaulted ? "DEFAULTED" : "FROZEN",
        },
    });

    return { ok: false, charged: 0, error: isDefaulted ? "DEFAULTED" : "PAYMENT_FAILED" };
}

// ═══════════════════════════════════════════════════════════════════════
// PILLAR 4: SMART PLAN RE-BUNDLING (USAGE-ADAPTIVE SUGGESTIONS)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Analyze user's actual usage and suggest optimal plan.
 * Called monthly or on-demand.
 *
 * Returns:
 *   UNDER_USING → downgrade suggestion (they're paying for unused capacity)
 *   OPTIMAL     → current plan is right
 *   OVER_USING  → upgrade suggestion (they're hitting limits constantly)
 */
export interface PlanFitAnalysis {
    userId: string;
    currentPlan: string;
    suggestedPlan: string;
    fitStatus: "UNDER_USING" | "OPTIMAL" | "OVER_USING";
    utilizationScore: number;  // 0–100
    monthlySavings: number;    // Negative = they'd save by downgrading
    monthlyExtraCost: number;  // What upgrade would cost
    reasons: string[];
}

export async function analyzePlanFit(userId: string): Promise<PlanFitAnalysis> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const [user, tokenSpend, boostCount, offerCount, listingCount] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { packageType: true, tokenBalance: true, createdAt: true },
        }),
        prisma.tokenTransaction.aggregate({
            where: { userId, amount: { lt: 0 }, createdAt: { gte: thirtyDaysAgo } },
            _sum: { amount: true },
        }),
        prisma.activeBoost.count({
            where: { userId, createdAt: { gte: thirtyDaysAgo } },
        }),
        prisma.requestInterest.count({
            where: { guideEmail: userId, createdAt: { gte: thirtyDaysAgo } },
        }),
        prisma.guideListing.count({
            where: { guideId: userId, active: true },
        }),
    ]);

    if (!user) throw new Error("User not found");

    const currentPlan = user.packageType as PackageType;
    const limits = PACKAGE_LIMITS[currentPlan] || PACKAGE_LIMITS.FREE;

    // Calculate utilization metrics
    const tokenUsageRatio = limits.monthlyTokens > 0
        ? Math.abs(tokenSpend._sum.amount ?? 0) / limits.monthlyTokens
        : 0;
    const boostUsageRatio = limits.maxBoosts > 0
        ? boostCount / (limits.maxBoosts * 30)
        : 0;
    const offerUsageRatio = limits.maxDailyOffers > 0
        ? offerCount / (limits.maxDailyOffers * 30)
        : 0;
    const listingUsageRatio = limits.maxListings > 0
        ? listingCount / limits.maxListings
        : 0;

    // Composite utilization
    const utilization = Math.round(
        (tokenUsageRatio * 0.40 +
            boostUsageRatio * 0.25 +
            offerUsageRatio * 0.25 +
            listingUsageRatio * 0.10) * 100,
    );

    const reasons: string[] = [];
    let fitStatus: "UNDER_USING" | "OPTIMAL" | "OVER_USING" = "OPTIMAL";
    let suggestedPlan = currentPlan;

    // OVER_USING: >85% utilization
    if (utilization > 85) {
        fitStatus = "OVER_USING";
        if (currentPlan === "FREE") suggestedPlan = "STARTER";
        else if (currentPlan === "STARTER") suggestedPlan = "PRO";
        else if (currentPlan === "PRO") suggestedPlan = "LEGEND";
        reasons.push(`Token usage at ${Math.round(tokenUsageRatio * 100)}% of monthly allotment`);
        if (boostUsageRatio > 0.8) reasons.push("Boost limit frequently reached");
        if (offerUsageRatio > 0.8) reasons.push("Offer limit frequently reached");
    }
    // UNDER_USING: <30% utilization and been on plan >60 days
    else if (utilization < 30 && currentPlan !== "FREE") {
        const daysOnPlan = (Date.now() - user.createdAt.getTime()) / 86_400_000;
        if (daysOnPlan > 60) {
            fitStatus = "UNDER_USING";
            if (currentPlan === "LEGEND") suggestedPlan = "PRO";
            else if (currentPlan === "PRO") suggestedPlan = "STARTER";
            reasons.push(`Only using ${utilization}% of plan capacity`);
            reasons.push("Consider saving by adjusting your plan");
        }
    }

    const currentPrice = PLAN_PRICES_TRY[currentPlan] ?? 0;
    const suggestedPrice = PLAN_PRICES_TRY[suggestedPlan as PackageType] ?? 0;

    return {
        userId,
        currentPlan,
        suggestedPlan,
        fitStatus,
        utilizationScore: utilization,
        monthlySavings: fitStatus === "UNDER_USING" ? currentPrice - suggestedPrice : 0,
        monthlyExtraCost: fitStatus === "OVER_USING" ? suggestedPrice - currentPrice : 0,
        reasons,
    };
}
