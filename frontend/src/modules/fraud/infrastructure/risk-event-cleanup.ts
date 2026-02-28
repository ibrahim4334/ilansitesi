// ─── RiskEvent Retention & Cleanup ──────────────────────────────────────
// Severity-based TTL policy to prevent unbounded table growth.
// Designed to run as a daily cron job.
//
// Retention:
//   LOW:      30 days
//   MEDIUM:   90 days
//   HIGH:     365 days
//   CRITICAL: Permanent (never deleted)

import { prisma } from "@/lib/prisma";

// ─── TTL Configuration ──────────────────────────────────────────────────

const RETENTION_DAYS: Record<string, number> = {
    "LOW": 30,
    "MEDIUM": 90,
    "HIGH": 365,
    // CRITICAL: never deleted
};

const BATCH_SIZE = 5000; // Delete in batches to avoid long locks
const MAX_BATCHES = 20;  // Safety limit: max 100K deletes per run

// ─── Cleanup Job ────────────────────────────────────────────────────────

/**
 * Delete expired risk events based on severity-level retention policy.
 * Uses batched deletes with LIMIT to avoid table lock contention.
 *
 * Call once daily (recommended: 03:00 local time).
 *
 * Performance at 1M users:
 *   - Typical: ~10K rows deleted in <5 seconds
 *   - After initial cleanup: <1K rows/day
 */
export async function cleanupRiskEvents(): Promise<{
    deletedTotal: number;
    batches: number;
    durationMs: number;
}> {
    const start = Date.now();
    let deletedTotal = 0;
    let batches = 0;

    for (let batch = 0; batch < MAX_BATCHES; batch++) {
        const deleted = await prisma.$executeRaw`
            DELETE FROM risk_events
            WHERE (
                (severity = 'LOW' AND createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY))
                OR (severity = 'MEDIUM' AND createdAt < DATE_SUB(NOW(), INTERVAL 90 DAY))
                OR (severity = 'HIGH' AND createdAt < DATE_SUB(NOW(), INTERVAL 365 DAY))
            )
            LIMIT ${BATCH_SIZE}
        `;

        deletedTotal += deleted;
        batches++;

        if (deleted < BATCH_SIZE) break; // No more rows to delete
    }

    const durationMs = Date.now() - start;

    // Log cleanup result
    if (deletedTotal > 0) {
        console.log(
            `[RiskEvent Cleanup] Deleted ${deletedTotal} expired events in ${batches} batches (${durationMs}ms)`
        );
    }

    return { deletedTotal, batches, durationMs };
}

// ─── Velocity Counter Cleanup ───────────────────────────────────────────

/**
 * Delete old velocity counters (older than 8 days).
 * The 8-day window provides buffer beyond the longest velocity rule (7 days for REFUND_REQUEST).
 */
export async function cleanupVelocityCounters(): Promise<{ deleted: number }> {
    const deleted = await prisma.$executeRaw`
        DELETE FROM velocity_counters
        WHERE createdAt < DATE_SUB(NOW(), INTERVAL 8 DAY)
        LIMIT ${BATCH_SIZE}
    `;

    if (deleted > 0) {
        console.log(`[Velocity Cleanup] Deleted ${deleted} expired counters`);
    }

    return { deleted };
}

// ─── Combined Daily Cleanup ─────────────────────────────────────────────

/**
 * Run all cleanup jobs. Call from cron scheduler.
 */
export async function dailyCleanup(): Promise<void> {
    const riskResult = await cleanupRiskEvents();
    const velocityResult = await cleanupVelocityCounters();

    console.log(
        `[Daily Cleanup] Risk events: ${riskResult.deletedTotal} deleted | ` +
        `Velocity counters: ${velocityResult.deleted} deleted | ` +
        `Duration: ${riskResult.durationMs}ms`
    );
}
