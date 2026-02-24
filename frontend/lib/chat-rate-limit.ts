/**
 * Two-tier chat rate limiter.
 *
 * Tier 1 — Burst (in-memory)
 *   Max 1 message per 2 seconds per (userId, conversationId).
 *   Uses the shared in-memory `rateLimit()` from rate-limit.ts.
 *   ⚠️  Not shared across multiple Node.js processes/replicas.
 *   For multi-instance deployment: replace with Redis SET NX + TTL.
 *
 * Tier 2 — Daily cap (DB-backed)
 *   Max 100 messages per (senderId, conversationId) per UTC calendar day.
 *   Uses a DB COUNT query — accurate across restarts and replicas.
 *   ⚠️  At high scale (>50 k/day): replace with a Redis counter
 *   (INCR + EXPIREAT set to next UTC midnight).
 */

import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

/** 2s burst: max 1 message per 2 seconds */
const BURST_WINDOW_MS = 2_000;
const BURST_MAX = 1;

/** Daily cap: 100 messages per conversation */
const DAILY_MAX = 100;

export interface RateLimitResult {
    allowed: boolean;
    /** HTTP status to return when not allowed */
    status: 429;
    reason: string;
    /** If applicable, a hint about when the limit resets */
    retryAfterMs?: number;
}

/**
 * Checks both rate limit tiers.
 * Call this before persisting a new message.
 *
 * @returns `{ allowed: true }` when the message should be accepted,
 *          or `{ allowed: false, status, reason }` when it should be rejected.
 */
export async function checkChatRateLimits(
    senderId: string,
    conversationId: string,
): Promise<{ allowed: true } | RateLimitResult> {
    // ── Tier 1: burst ──────────────────────────────────────────────────────
    const burstKey = `chat:burst:${senderId}:${conversationId}`;
    const burst = rateLimit(burstKey, BURST_WINDOW_MS, BURST_MAX);
    if (!burst.success) {
        return {
            allowed: false,
            status: 429,
            reason: "Too fast — wait 2 seconds between messages.",
            retryAfterMs: BURST_WINDOW_MS,
        };
    }

    // ── Tier 2: daily cap ──────────────────────────────────────────────────
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const dailyCount = await prisma.message.count({
        where: {
            senderId,
            conversationId,
            deletedAt: null,           // don't count deleted messages
            createdAt: { gte: startOfDay },
        },
    });

    if (dailyCount >= DAILY_MAX) {
        const tomorrowUtc = new Date(startOfDay);
        tomorrowUtc.setUTCDate(tomorrowUtc.getUTCDate() + 1);
        return {
            allowed: false,
            status: 429,
            reason: `Daily message limit reached (${DAILY_MAX}/day per conversation). Resets at midnight UTC.`,
            retryAfterMs: tomorrowUtc.getTime() - Date.now(),
        };
    }

    return { allowed: true };
}
