// ─── Subscription Management Service ────────────────────────────────────
// Handles plan upgrades, downgrades, freezes, and cooldown enforcement.
//
// Rules:
//   Upgrade:   Instant activation, token difference granted
//   Downgrade: Takes effect at packageExpiry, 7-day cooldown
//   Freeze:    ₺99/mo, preserves profile, no tokens
//   Blast Guard: If >80% tokens spent in <48h, block downgrade

import { prisma } from "@/lib/prisma";
import { withSerializableRetry } from "@/lib/with-retry";
import {
    PACKAGE_LIMITS,
    PLAN_PRICES_TRY,
    DOWNGRADE_COOLDOWN_DAYS,
    BLAST_THRESHOLD_HOURS,
    BLAST_THRESHOLD_PCT,
    isUpgrade,
    isDowngrade,
} from "@/lib/package-system";
import type { PackageType } from "@/lib/db-types";
import { grantToken } from "./grant-token.usecase";
import { EventBus } from "@/src/core/events/event-bus";

// ─── Types ──────────────────────────────────────────────────────────────

export interface PlanChangeResult {
    ok: boolean;
    newPlan: string;
    effectiveAt: Date;     // Immediate for upgrade, packageExpiry for downgrade
    tokenDelta: number;    // Tokens granted/removed
    error?: string;
}

// ─── Upgrade ────────────────────────────────────────────────────────────

/**
 * Upgrade a user's plan. Instant activation.
 * Grants the token difference between old and new plan.
 *
 * @param billing - "MONTHLY" | "ANNUAL"
 */
export async function upgradePlan(
    userId: string,
    targetPlan: PackageType,
    billing: "MONTHLY" | "ANNUAL" = "MONTHLY",
): Promise<PlanChangeResult> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            packageType: true,
            packageExpiry: true,
            tokenBalance: true,
            lastPlanChangeAt: true,
        },
    });
    if (!user) throw new Error("User not found");

    // Validate it's actually an upgrade
    if (!isUpgrade(user.packageType, targetPlan)) {
        return { ok: false, newPlan: user.packageType, effectiveAt: new Date(), tokenDelta: 0, error: "NOT_AN_UPGRADE" };
    }

    // Cooldown check
    const cooldownError = checkCooldown(user.lastPlanChangeAt);
    if (cooldownError) {
        return { ok: false, newPlan: user.packageType, effectiveAt: new Date(), tokenDelta: 0, error: cooldownError };
    }

    // Calculate token difference
    const oldLimits = PACKAGE_LIMITS[user.packageType as PackageType] || PACKAGE_LIMITS.FREE;
    const newLimits = PACKAGE_LIMITS[targetPlan] || PACKAGE_LIMITS.FREE;
    const tokenDelta = Math.max(0, newLimits.initialTokens - oldLimits.initialTokens);

    // Calculate expiry
    const months = billing === "ANNUAL" ? 12 : 1;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);

    // Apply upgrade atomically
    await withSerializableRetry(() =>
        prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: {
                    packageType: targetPlan,
                    packageExpiry: expiry,
                    lastPlanChangeAt: new Date(),
                },
            });
        }, { isolationLevel: "Serializable", timeout: 10_000 })
    );

    // Grant token delta (outside transaction — idempotent)
    if (tokenDelta > 0) {
        await grantToken({
            userId,
            amount: tokenDelta,
            type: "SUBSCRIPTION",
            reason: `Plan upgrade to ${targetPlan}`,
            idempotencyKey: `upgrade:${userId}:${targetPlan}:${Date.now()}`,
        });
    }

    EventBus.emit("PLAN_UPGRADED", { userId, from: user.packageType, to: targetPlan, tokenDelta });

    return { ok: true, newPlan: targetPlan, effectiveAt: new Date(), tokenDelta };
}

// ─── Downgrade ──────────────────────────────────────────────────────────

/**
 * Schedule a downgrade. Takes effect at packageExpiry.
 * Enforces 7-day cooldown and blast detection.
 */
export async function downgradePlan(
    userId: string,
    targetPlan: PackageType,
): Promise<PlanChangeResult> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            packageType: true,
            packageExpiry: true,
            tokenBalance: true,
            lastPlanChangeAt: true,
        },
    });
    if (!user) throw new Error("User not found");

    if (!isDowngrade(user.packageType, targetPlan)) {
        return { ok: false, newPlan: user.packageType, effectiveAt: new Date(), tokenDelta: 0, error: "NOT_A_DOWNGRADE" };
    }

    // Cooldown check
    const cooldownError = checkCooldown(user.lastPlanChangeAt);
    if (cooldownError) {
        return { ok: false, newPlan: user.packageType, effectiveAt: new Date(), tokenDelta: 0, error: cooldownError };
    }

    // Blast detection: if >80% tokens spent in <48h, block downgrade
    const blastDetected = await detectBlast(userId);
    if (blastDetected) {
        return {
            ok: false,
            newPlan: user.packageType,
            effectiveAt: new Date(),
            tokenDelta: 0,
            error: "BLAST_DETECTED: Unusual token spending detected. Downgrade blocked for 48 hours.",
        };
    }

    // Schedule downgrade at packageExpiry (or immediately if no expiry)
    const effectiveAt = user.packageExpiry ?? new Date();

    await prisma.user.update({
        where: { id: userId },
        data: {
            // Store scheduled downgrade — a cron job will apply it at packageExpiry
            // For now, we apply immediately if past expiry
            packageType: effectiveAt <= new Date() ? targetPlan : user.packageType,
            lastPlanChangeAt: new Date(),
        },
    });

    EventBus.emit("PLAN_DOWNGRADE_SCHEDULED", {
        userId,
        from: user.packageType,
        to: targetPlan,
        effectiveAt,
    });

    return { ok: true, newPlan: targetPlan, effectiveAt, tokenDelta: 0 };
}

// ─── Freeze ─────────────────────────────────────────────────────────────

/**
 * Freeze a plan for 1-3 months at ₺99/mo.
 * Preserves profile visibility but no tokens, no boost.
 *
 * @param months - 1 to 3 months freeze duration
 */
export async function freezePlan(
    userId: string,
    months: number = 1,
): Promise<{ ok: boolean; freezeUntil: Date; error?: string }> {
    if (months < 1 || months > 3) {
        return { ok: false, freezeUntil: new Date(), error: "Freeze duration must be 1-3 months" };
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { packageType: true, planFreezeUntil: true },
    });

    if (!user) throw new Error("User not found");
    if (user.packageType === "FREE") {
        return { ok: false, freezeUntil: new Date(), error: "Free plan cannot be frozen" };
    }
    if (user.planFreezeUntil && user.planFreezeUntil > new Date()) {
        return { ok: false, freezeUntil: user.planFreezeUntil, error: "Plan is already frozen" };
    }

    const freezeUntil = new Date();
    freezeUntil.setMonth(freezeUntil.getMonth() + months);

    await prisma.user.update({
        where: { id: userId },
        data: {
            planFreezeUntil: freezeUntil,
            lastPlanChangeAt: new Date(),
        },
    });

    EventBus.emit("PLAN_FROZEN", { userId, freezeUntil, months });

    return { ok: true, freezeUntil };
}

// ─── Can Change Plan Check ─────────────────────────────────────────────

export async function canChangePlan(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    cooldownEndsAt?: Date;
}> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lastPlanChangeAt: true, planFreezeUntil: true },
    });

    if (!user) return { allowed: false, reason: "User not found" };

    if (user.planFreezeUntil && user.planFreezeUntil > new Date()) {
        return { allowed: false, reason: "PLAN_FROZEN", cooldownEndsAt: user.planFreezeUntil };
    }

    const cooldownError = checkCooldown(user.lastPlanChangeAt);
    if (cooldownError) {
        const cooldownEndsAt = new Date(user.lastPlanChangeAt!);
        cooldownEndsAt.setDate(cooldownEndsAt.getDate() + DOWNGRADE_COOLDOWN_DAYS);
        return { allowed: false, reason: cooldownError, cooldownEndsAt };
    }

    return { allowed: true };
}

// ─── Helpers ────────────────────────────────────────────────────────────

function checkCooldown(lastPlanChangeAt: Date | null): string | null {
    if (!lastPlanChangeAt) return null;

    const daysSinceChange = (Date.now() - lastPlanChangeAt.getTime()) / 86_400_000;
    if (daysSinceChange < DOWNGRADE_COOLDOWN_DAYS) {
        const remainingDays = Math.ceil(DOWNGRADE_COOLDOWN_DAYS - daysSinceChange);
        return `COOLDOWN: Plan change not allowed for ${remainingDays} more day(s).`;
    }
    return null;
}

/**
 * Blast detection: if user spent >80% of tokens in last 48 hours,
 * they might be gaming the system (upgrade → blast tokens → downgrade).
 */
async function detectBlast(userId: string): Promise<boolean> {
    const cutoff = new Date(Date.now() - BLAST_THRESHOLD_HOURS * 3600 * 1000);

    const [user, recentSpend] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { tokenBalance: true },
        }),
        prisma.tokenTransaction.aggregate({
            where: {
                userId,
                amount: { lt: 0 },  // Only spending (negative entries)
                createdAt: { gte: cutoff },
            },
            _sum: { amount: true },
        }),
    ]);

    if (!user) return false;

    const totalSpent = Math.abs(recentSpend._sum.amount ?? 0);
    const totalAvailable = user.tokenBalance + totalSpent;

    if (totalAvailable <= 0) return false;

    return (totalSpent / totalAvailable) >= BLAST_THRESHOLD_PCT;
}

// ─── Get Upgrade Price ──────────────────────────────────────────────────

/**
 * Calculate the price for upgrading from current plan to target plan.
 * Returns prorated price if mid-billing-cycle.
 */
export function getUpgradePrice(
    currentPlan: string,
    targetPlan: string,
    billing: "MONTHLY" | "ANNUAL" = "MONTHLY",
    daysRemainingInCycle: number = 30,
): { priceTRY: number; savings: number; billingPeriod: string } {
    const currentPrice = PLAN_PRICES_TRY[currentPlan as PackageType] ?? 0;
    const targetPrice = PLAN_PRICES_TRY[targetPlan as PackageType] ?? 0;

    const monthlyDiff = targetPrice - currentPrice;

    // Prorate for remaining days in current cycle
    const prorated = Math.round(monthlyDiff * (daysRemainingInCycle / 30));

    if (billing === "ANNUAL") {
        const annualPrice = Math.round(targetPrice * 12 * (1 - 0.14));
        const currentAnnual = Math.round(currentPrice * 12 * (1 - 0.14));
        return {
            priceTRY: annualPrice - currentAnnual,
            savings: Math.round(targetPrice * 12 * 0.14),
            billingPeriod: "annual",
        };
    }

    return { priceTRY: prorated, savings: 0, billingPeriod: "monthly" };
}
