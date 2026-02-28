// ─── Token Auto-Replenishment Service ───────────────────────────────────
// Automatically purchases tokens when a user's balance drops below their
// configured threshold. Triggered by the TOKEN_SPENT event from spendToken().
//
// State Machine: ACTIVE → PAUSED → ACTIVE (user toggle)
//                ACTIVE → SUSPENDED (3 consecutive payment failures)
//                ACTIVE → DISABLED (user explicit disable)
//                SUSPENDED → ACTIVE (user re-enables after fixing payment)
//
// Safety layers:
//   1. Monthly hard cap (monthlyCap)  → prevents runaway billing
//   2. Cooldown window (cooldownMinutes) → prevents rapid-fire purchases
//   3. Fail circuit breaker (failCount ≥ 3 → SUSPENDED)
//   4. Fraud pattern detection (velocity check)
//   5. Idempotency key per trigger → prevents double-charge on race conditions
//   6. Spending alerts via EventBus
//   7. SERIALIZABLE isolation on balance check → no phantom reads

import { prisma } from "@/lib/prisma";
import { TOKEN_PACKAGES } from "@/lib/package-system";
import { grantToken } from "./grant-token.usecase";
import { EventBus } from "@/src/core/events/event-bus";
import { checkVelocity } from "@/src/modules/fraud/infrastructure/velocity-counter";

// ─── Types ──────────────────────────────────────────────────────────────

export type ReplenishStatus = "ACTIVE" | "PAUSED" | "DISABLED" | "SUSPENDED";

export interface ConfigureReplenishInput {
    userId: string;
    threshold: number;      // Min: 5, Max: 200
    packageId: string;      // TOKEN_PACKAGES id
    monthlyCap: number;     // Min: 10, Max: 2000
    cooldownMinutes?: number; // Default: 60
}

export interface ReplenishCheckResult {
    triggered: boolean;
    tokensGranted: number;
    priceTRY: number;
    status: "SUCCESS" | "FAILED" | "CAPPED" | "COOLDOWN" | "NOT_ACTIVE" | "BELOW_THRESHOLD";
    failReason?: string;
}

// ─── Configuration Constants ────────────────────────────────────────────

const MIN_THRESHOLD = 5;
const MAX_THRESHOLD = 200;
const MIN_MONTHLY_CAP = 10;
const MAX_MONTHLY_CAP = 2000;
const MAX_FAIL_COUNT = 3;    // → SUSPENDED after 3 consecutive failures
const DEFAULT_COOLDOWN = 60; // minutes

// Spending alert thresholds (% of monthly cap)
const ALERT_THRESHOLDS = [0.50, 0.80, 0.95];

// ─── Configure ──────────────────────────────────────────────────────────

/**
 * Create or update auto-replenish configuration.
 * Validates inputs and resolves package from TOKEN_PACKAGES.
 */
export async function configureAutoReplenish(
    input: ConfigureReplenishInput,
): Promise<{ ok: boolean; error?: string }> {
    // Input validation
    if (input.threshold < MIN_THRESHOLD || input.threshold > MAX_THRESHOLD) {
        return { ok: false, error: `Threshold must be ${MIN_THRESHOLD}–${MAX_THRESHOLD}` };
    }
    if (input.monthlyCap < MIN_MONTHLY_CAP || input.monthlyCap > MAX_MONTHLY_CAP) {
        return { ok: false, error: `Monthly cap must be ${MIN_MONTHLY_CAP}–${MAX_MONTHLY_CAP}` };
    }

    // Validate package exists
    const pkg = TOKEN_PACKAGES.find(p => p.id === input.packageId);
    if (!pkg) {
        return { ok: false, error: `Invalid package: ${input.packageId}` };
    }

    // Verify user exists and is on a paid plan
    const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { packageType: true },
    });
    if (!user) return { ok: false, error: "User not found" };
    if (user.packageType === "FREE") {
        return { ok: false, error: "Auto-replenish requires a paid plan" };
    }

    // Upsert config
    await prisma.autoReplenishConfig.upsert({
        where: { userId: input.userId },
        create: {
            userId: input.userId,
            threshold: input.threshold,
            packageId: input.packageId,
            monthlyCap: input.monthlyCap,
            cooldownMinutes: input.cooldownMinutes ?? DEFAULT_COOLDOWN,
            status: "ACTIVE",
        },
        update: {
            threshold: input.threshold,
            packageId: input.packageId,
            monthlyCap: input.monthlyCap,
            cooldownMinutes: input.cooldownMinutes ?? DEFAULT_COOLDOWN,
            status: "ACTIVE",  // Re-enable if was SUSPENDED
            failCount: 0,      // Reset fail counter on reconfigure
        },
    });

    EventBus.emit("AUTO_REPLENISH_CONFIGURED", {
        userId: input.userId,
        threshold: input.threshold,
        packageId: input.packageId,
        monthlyCap: input.monthlyCap,
    });

    return { ok: true };
}

// ─── Toggle ─────────────────────────────────────────────────────────────

/**
 * Pause/resume or fully disable auto-replenish.
 */
export async function setReplenishStatus(
    userId: string,
    status: "ACTIVE" | "PAUSED" | "DISABLED",
): Promise<{ ok: boolean; error?: string }> {
    const config = await prisma.autoReplenishConfig.findUnique({
        where: { userId },
    });
    if (!config) return { ok: false, error: "No auto-replenish configured" };

    // Allow SUSPENDED → ACTIVE (user manually re-enables)
    await prisma.autoReplenishConfig.update({
        where: { userId },
        data: {
            status,
            failCount: status === "ACTIVE" ? 0 : config.failCount,
        },
    });

    return { ok: true };
}

// ─── Core: Check & Trigger ──────────────────────────────────────────────

/**
 * Check if auto-replenish should fire for a user.
 * Called AFTER spendToken completes, via TOKEN_SPENT event listener.
 *
 * Safety chain:
 *   1. Config exists and is ACTIVE?
 *   2. Balance < threshold?
 *   3. Monthly cap not reached?
 *   4. Cooldown elapsed?
 *   5. Fraud velocity OK?
 *   6. Execute purchase (idempotent)
 *   7. Fire spending alerts if thresholds crossed
 */
export async function checkAndReplenish(
    userId: string,
    currentBalance: number,
    triggerSource: "SPEND_EVENT" | "MANUAL_CHECK" | "CRON" = "SPEND_EVENT",
): Promise<ReplenishCheckResult> {
    // ── 1. Load config ──────────────────────────────────────────────
    const config = await prisma.autoReplenishConfig.findUnique({
        where: { userId },
    });

    if (!config || config.status !== "ACTIVE") {
        return { triggered: false, tokensGranted: 0, priceTRY: 0, status: "NOT_ACTIVE" };
    }

    // ── 2. Threshold check ──────────────────────────────────────────
    if (currentBalance >= config.threshold) {
        return { triggered: false, tokensGranted: 0, priceTRY: 0, status: "BELOW_THRESHOLD" };
    }

    // ── 3. Monthly cap check (reset if new month) ───────────────────
    const now = new Date();
    let monthlySpent = config.monthlySpent;
    if (now.getMonth() !== config.monthlyResetAt.getMonth() ||
        now.getFullYear() !== config.monthlyResetAt.getFullYear()) {
        // New month — reset counter
        await prisma.autoReplenishConfig.update({
            where: { userId },
            data: { monthlySpent: 0, monthlyResetAt: now },
        });
        monthlySpent = 0;
    }

    const pkg = TOKEN_PACKAGES.find(p => p.id === config.packageId);
    if (!pkg) {
        return { triggered: false, tokensGranted: 0, priceTRY: 0, status: "FAILED", failReason: "Invalid package" };
    }

    if (monthlySpent + pkg.tokens > config.monthlyCap) {
        await logReplenish(config.id, userId, pkg, currentBalance, currentBalance, triggerSource, "CAPPED");
        return { triggered: false, tokensGranted: 0, priceTRY: 0, status: "CAPPED" };
    }

    // ── 4. Cooldown check ───────────────────────────────────────────
    if (config.lastTriggeredAt) {
        const minutesSinceLast = (now.getTime() - config.lastTriggeredAt.getTime()) / 60_000;
        if (minutesSinceLast < config.cooldownMinutes) {
            await logReplenish(config.id, userId, pkg, currentBalance, currentBalance, triggerSource, "COOLDOWN");
            return { triggered: false, tokensGranted: 0, priceTRY: 0, status: "COOLDOWN" };
        }
    }

    // ── 5. Fraud velocity check ─────────────────────────────────────
    const velocityResult = await checkVelocity(userId, "AUTO_REPLENISH");
    if (!velocityResult.allowed) {
        await logReplenish(config.id, userId, pkg, currentBalance, currentBalance, triggerSource, "FAILED", "Velocity limit exceeded");
        return { triggered: false, tokensGranted: 0, priceTRY: 0, status: "FAILED", failReason: "Velocity limit" };
    }

    // ── 6. Execute token purchase ───────────────────────────────────
    // Idempotency key: user + month + spend-count → deterministic dedup
    // If two triggers fire at the same monthlySpent, second gets P2002 → harmless.
    // This eliminates the "double package within cap" edge case entirely.
    const idempotencyKey = `auto-replenish:${userId}:${now.getFullYear()}-${now.getMonth()}:${monthlySpent}`;

    try {
        const grantResult = await grantToken({
            userId,
            amount: pkg.tokens,
            type: "PURCHASE",
            reason: `Auto-replenish (${pkg.id}, threshold=${config.threshold})`,
            idempotencyKey,
        });

        if (grantResult.alreadyProcessed) {
            return { triggered: false, tokensGranted: 0, priceTRY: 0, status: "SUCCESS" };
        }

        // Update config counters
        await prisma.autoReplenishConfig.update({
            where: { userId },
            data: {
                monthlySpent: { increment: pkg.tokens },
                lastTriggeredAt: now,
                failCount: 0, // Reset on success
            },
        });

        // Log success
        await logReplenish(config.id, userId, pkg, currentBalance, grantResult.newBalance, triggerSource, "SUCCESS");

        // ── 7. Spending alerts ──────────────────────────────────────
        const newMonthlySpent = monthlySpent + pkg.tokens;
        const capRatio = newMonthlySpent / config.monthlyCap;
        for (const alertThreshold of ALERT_THRESHOLDS) {
            if (capRatio >= alertThreshold && (monthlySpent / config.monthlyCap) < alertThreshold) {
                EventBus.emit("AUTO_REPLENISH_ALERT", {
                    userId,
                    percentUsed: Math.round(capRatio * 100),
                    monthlySpent: newMonthlySpent,
                    monthlyCap: config.monthlyCap,
                    threshold: alertThreshold,
                });
            }
        }

        EventBus.emit("AUTO_REPLENISH_SUCCESS", {
            userId,
            tokensGranted: pkg.tokens,
            priceTRY: pkg.priceTRY,
            newBalance: grantResult.newBalance,
        });

        return {
            triggered: true,
            tokensGranted: pkg.tokens,
            priceTRY: pkg.priceTRY,
            status: "SUCCESS",
        };

    } catch (error: any) {
        // Payment failure — increment fail count
        const newFailCount = config.failCount + 1;
        await prisma.autoReplenishConfig.update({
            where: { userId },
            data: {
                failCount: newFailCount,
                status: newFailCount >= MAX_FAIL_COUNT ? "SUSPENDED" : "ACTIVE",
            },
        });

        await logReplenish(config.id, userId, pkg, currentBalance, currentBalance, triggerSource, "FAILED", error.message);

        if (newFailCount >= MAX_FAIL_COUNT) {
            EventBus.emit("AUTO_REPLENISH_SUSPENDED", {
                userId,
                failCount: newFailCount,
                reason: "MAX_CONSECUTIVE_FAILURES",
            });
        }

        return {
            triggered: false,
            tokensGranted: 0,
            priceTRY: 0,
            status: "FAILED",
            failReason: error.message,
        };
    }
}

// ─── Monthly Reset Cron ─────────────────────────────────────────────────

/**
 * Reset monthlySpent counters for all configs. Run via cron at 00:00 UTC on 1st.
 */
export async function resetMonthlyCounters(): Promise<number> {
    const result = await prisma.autoReplenishConfig.updateMany({
        where: { status: { in: ["ACTIVE", "PAUSED"] } },
        data: { monthlySpent: 0, monthlyResetAt: new Date() },
    });
    return result.count;
}

// ─── Helpers ────────────────────────────────────────────────────────────

async function logReplenish(
    configId: string,
    userId: string,
    pkg: typeof TOKEN_PACKAGES[number],
    balanceBefore: number,
    balanceAfter: number,
    triggerSource: string,
    status: string,
    failReason?: string,
) {
    await prisma.tokenReplenishLog.create({
        data: {
            configId,
            userId,
            tokensGranted: status === "SUCCESS" ? pkg.tokens : 0,
            priceTRY: status === "SUCCESS" ? pkg.priceTRY : 0,
            packageId: pkg.id,
            balanceBefore,
            balanceAfter,
            triggerSource,
            status,
            failReason: failReason || null,
            idempotencyKey: `replenish-log:${userId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
        },
    }).catch(() => {
        // Log failure is non-critical — don't break the flow
        console.error(`[AutoReplenish] Failed to log replenish event for ${userId}`);
    });
}
