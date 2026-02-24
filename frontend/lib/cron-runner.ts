import cron from "node-cron";
import { runExpiration } from "./expiration-service";

// ─── Cron Runner ────────────────────────────────────────────────────────
// Self-hosted cron scheduler using node-cron.
// Import this file from your server entry point (e.g., custom server.ts or instrumentation.ts).
//
// For Vercel/serverless: use vercel.json crons + /api/cron/expire-listings instead.

let isRunning = false;

/**
 * Start the cron scheduler.
 * Safe to call multiple times — only starts once.
 */
export function startCronJobs(): void {
    if (isRunning) {
        console.log("[Cron] Already running, skipping duplicate start.");
        return;
    }

    // ── Expire stale entities: every 15 minutes ─────────────────────
    cron.schedule("*/15 * * * *", async () => {
        console.log(`[Cron] Running expiration check at ${new Date().toISOString()}`);
        try {
            const result = await runExpiration();
            console.log(`[Cron] Expiration complete:`, result);
        } catch (error) {
            console.error("[Cron] Expiration failed:", error);
        }
    }, {
        timezone: "Europe/Istanbul",
    });

    isRunning = true;
    console.log("[Cron] Scheduled: expire-listings (*/15 * * * *)");
}

/**
 * Check if cron is running.
 */
export function isCronRunning(): boolean {
    return isRunning;
}
