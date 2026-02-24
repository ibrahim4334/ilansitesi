// ─── Token Renewal Job ──────────────────────────────────────────────────
// Monthly subscription token renewal.
// Runs on the 1st of each month at 03:00 Istanbul time.

import cron from "node-cron";
import { processMonthlyRenewal } from "@/src/modules/tokens/application/renewal.usecase";

let isRunning = false;

/**
 * Start the monthly token renewal job.
 */
export function startTokenRenewalJob(): void {
    if (isRunning) return;

    // 1st of every month at 03:00 Istanbul
    cron.schedule("0 3 1 * *", async () => {
        console.log(`[Job:Renewal] Monthly token renewal at ${new Date().toISOString()}`);
        try {
            const result = await processMonthlyRenewal();
            console.log(`[Job:Renewal] Done:`, result);
        } catch (error) {
            console.error("[Job:Renewal] Failed:", error);
        }
    }, { timezone: "Europe/Istanbul" });

    isRunning = true;
    console.log("[Job:Renewal] Scheduled (0 3 1 * *)");
}
