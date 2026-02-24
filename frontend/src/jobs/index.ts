// ─── Job Runner ─────────────────────────────────────────────────────────
// Entry point for all scheduled jobs.
// Import this from your server bootstrap (instrumentation.ts or custom server.ts).

import { startExpirationJob } from "./expiration.job";
import { startTokenRenewalJob } from "./token-renewal.job";

let started = false;

/**
 * Start all scheduled jobs. Safe to call multiple times.
 */
export function startAllJobs(): void {
    if (started) return;

    console.log("[Jobs] Starting all scheduled jobs...");

    startExpirationJob();
    startTokenRenewalJob();

    started = true;
    console.log("[Jobs] All jobs started.");
}
