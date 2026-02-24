// ─── Expiration Job ─────────────────────────────────────────────────────
// Scheduled job: expires listings, demands, offers, and featured badges.
// Wraps expiration-service with event emission.

import cron from "node-cron";
import { runExpiration } from "@/lib/expiration-service";
import { EventBus } from "@/src/core/events/event-bus";

let isRunning = false;

/**
 * Start expiration cron job. Runs every 15 minutes.
 */
export function startExpirationJob(): void {
    if (isRunning) return;

    cron.schedule("*/15 * * * *", async () => {
        console.log(`[Job:Expiration] Running at ${new Date().toISOString()}`);
        try {
            const result = await runExpiration();

            // Emit events for expired entities
            if (result.expiredListings > 0) {
                await EventBus.emit("LISTING_EXPIRED", {
                    count: result.expiredListings,
                    timestamp: new Date(),
                });
            }
            if (result.expiredDemands > 0) {
                await EventBus.emit("DEMAND_EXPIRED", {
                    count: result.expiredDemands,
                    timestamp: new Date(),
                });
            }
            if (result.expiredOffers > 0) {
                await EventBus.emit("OFFER_EXPIRED", {
                    count: result.expiredOffers,
                    timestamp: new Date(),
                });
            }

            console.log(`[Job:Expiration] Done:`, result);
        } catch (error) {
            console.error("[Job:Expiration] Failed:", error);
        }
    }, { timezone: "Europe/Istanbul" });

    isRunning = true;
    console.log("[Job:Expiration] Scheduled (*/15 * * * *)");
}
