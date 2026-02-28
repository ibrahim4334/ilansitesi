// ─── Persistent Velocity Counter (DB-backed) ────────────────────────────
// Replaces in-memory Map with DB-persisted counters.
// Survives deploys, crashes, and horizontal scaling.
// In-memory cache layer for hot-path O(1) reads (60s TTL).

import { prisma } from "@/lib/prisma";

// ─── In-Memory Cache (60s TTL, best-effort) ─────────────────────────────

interface CacheEntry {
    count: number;
    expiresAt: number;
}

const cache: Map<string, CacheEntry> = new Map();
const CACHE_TTL_MS = 60_000; // 60 seconds

function getCacheKey(userId: string, action: string, windowSeconds: number): string {
    return `${userId}:${action}:${windowSeconds}`;
}

function getFromCache(key: string): number | null {
    const entry = cache.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.count;
}

function setCache(key: string, count: number): void {
    cache.set(key, { count, expiresAt: Date.now() + CACHE_TTL_MS });
}

// Periodic cache cleanup (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
        if (now > entry.expiresAt) cache.delete(key);
    }
}, 5 * 60_000);

// ─── Velocity Rules ─────────────────────────────────────────────────────

export interface VelocityRule {
    action: string;
    windowSeconds: number;
    maxCount: number;
    response: "WARN" | "THROTTLE" | "BLOCK";
}

export const VELOCITY_RULES: VelocityRule[] = [
    { action: "OFFER_SEND", windowSeconds: 3600, maxCount: 15, response: "THROTTLE" },
    { action: "OFFER_SEND", windowSeconds: 86400, maxCount: 40, response: "BLOCK" },
    { action: "DEMAND_UNLOCK", windowSeconds: 3600, maxCount: 10, response: "THROTTLE" },
    { action: "BOOST", windowSeconds: 86400, maxCount: 9, response: "BLOCK" },
    { action: "BOOST_PORTFOLIO", windowSeconds: 86400, maxCount: 9, response: "BLOCK" },
    { action: "LOGIN_ATTEMPT", windowSeconds: 300, maxCount: 10, response: "BLOCK" },
    { action: "REGISTER", windowSeconds: 3600, maxCount: 3, response: "BLOCK" },
    { action: "REVIEW_SUBMIT", windowSeconds: 86400, maxCount: 5, response: "THROTTLE" },
    { action: "MESSAGE_SEND", windowSeconds: 60, maxCount: 20, response: "THROTTLE" },
    { action: "LISTING_CREATE", windowSeconds: 86400, maxCount: 5, response: "BLOCK" },
    { action: "REFUND_REQUEST", windowSeconds: 604800, maxCount: 3, response: "BLOCK" },
];

// ─── Public API ─────────────────────────────────────────────────────────

export interface VelocityCheckResult {
    allowed: boolean;
    response: "PASS" | "WARN" | "THROTTLE" | "BLOCK";
    violatedRule?: VelocityRule;
    currentCount: number;
    limit: number;
    windowSeconds: number;
    retryAfterSeconds?: number;
}

/**
 * Get the current velocity count for a user+action in a time window.
 * Uses DB-backed counters with in-memory cache.
 */
async function getVelocityCount(userId: string, action: string, windowSeconds: number): Promise<number> {
    const cacheKey = getCacheKey(userId, action, windowSeconds);

    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached !== null) return cached;

    // DB query: sum counts from hourly buckets within window
    const windowStart = new Date(Date.now() - windowSeconds * 1000);
    const result = await prisma.velocityCounter.aggregate({
        _sum: { count: true },
        where: {
            userId,
            action,
            createdAt: { gte: windowStart },
        },
    });

    const count = result._sum.count || 0;
    setCache(cacheKey, count);
    return count;
}

/**
 * Record an action and check velocity limits.
 * Call BEFORE executing the action.
 *
 * WRITE-THROUGH: Increments DB FIRST, invalidates cache, THEN checks.
 * Eliminates stale cache window (Red Team Fix #F).
 */
export async function checkVelocity(userId: string, action: string): Promise<VelocityCheckResult> {
    const applicableRules = VELOCITY_RULES.filter(r => r.action === action);

    // 1. INCREMENT DB FIRST (atomic upsert) — before any check
    const now = new Date();
    const windowKey = now.toISOString().slice(0, 13); // "2026-02-28T15"
    try {
        await prisma.$executeRaw`
            INSERT INTO velocity_counters (id, userId, action, windowKey, count, createdAt)
            VALUES (${generateId()}, ${userId}, ${action}, ${windowKey}, 1, NOW())
            ON DUPLICATE KEY UPDATE count = count + 1
        `;
    } catch {
        // Non-blocking: if recording fails, still check with stale data
    }

    // 2. INVALIDATE cache (force next read to hit DB)
    for (const rule of applicableRules) {
        cache.delete(getCacheKey(userId, action, rule.windowSeconds));
    }

    // 3. NOW CHECK limits (reads from DB since cache was just invalidated)
    let worstViolation: VelocityCheckResult | null = null;

    for (const rule of applicableRules) {
        const count = await getVelocityCount(userId, action, rule.windowSeconds);

        // Use > (not >=) because we already incremented above
        if (count > rule.maxCount) {
            const result: VelocityCheckResult = {
                allowed: rule.response === "WARN",
                response: rule.response,
                violatedRule: rule,
                currentCount: count,
                limit: rule.maxCount,
                windowSeconds: rule.windowSeconds,
                retryAfterSeconds: rule.windowSeconds,
            };

            if (!worstViolation || severity(rule.response) > severity(worstViolation.response)) {
                worstViolation = result;
            }
        }
    }

    if (worstViolation) {
        return worstViolation;
    }

    // No violation — return pass
    const tightestRule = applicableRules.sort((a, b) => a.windowSeconds - b.windowSeconds)[0];
    return {
        allowed: true,
        response: "PASS",
        currentCount: 0,
        limit: tightestRule?.maxCount ?? Infinity,
        windowSeconds: tightestRule?.windowSeconds ?? 0,
    };
}

/**
 * Check velocity WITHOUT recording (dry-run).
 * Good for UI pre-flight checks.
 */
export async function peekVelocity(userId: string, action: string): Promise<VelocityCheckResult> {
    const applicableRules = VELOCITY_RULES.filter(r => r.action === action);

    for (const rule of applicableRules) {
        const count = await getVelocityCount(userId, action, rule.windowSeconds);
        if (count >= rule.maxCount) {
            return {
                allowed: rule.response === "WARN",
                response: rule.response,
                violatedRule: rule,
                currentCount: count,
                limit: rule.maxCount,
                windowSeconds: rule.windowSeconds,
            };
        }
    }

    return { allowed: true, response: "PASS", currentCount: 0, limit: Infinity, windowSeconds: 0 };
}

/**
 * Get velocity count for external use (e.g., boost sliding window).
 */
export { getVelocityCount };

function severity(response: string): number {
    if (response === "BLOCK") return 3;
    if (response === "THROTTLE") return 2;
    if (response === "WARN") return 1;
    return 0;
}

function generateId(): string {
    return `vel_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
