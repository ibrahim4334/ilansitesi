// ─── Auto-Replenish Event Listener ──────────────────────────────────────
// Registers the TOKEN_SPENT event handler that triggers auto-replenishment.
// Import this module once at app startup (e.g., in _app.ts or server init).
//
// Architecture decision: fire-and-forget after spendToken completes.
// This keeps the spend path fast and avoids transaction coupling.

import { EventBus } from "@/src/core/events/event-bus";
import { checkAndReplenish } from "./auto-replenish.service";

let registered = false;

/**
 * Register the auto-replenish listener.
 * Safe to call multiple times — only registers once.
 */
export function registerAutoReplenishListener(): void {
    if (registered) return;

    EventBus.on("TOKEN_SPENT", async (event: {
        userId: string;
        action: string;
        cost: number;
        newBalance: number;
        relatedId?: string;
    }) => {
        try {
            // Fire-and-forget: don't block the spend response
            await checkAndReplenish(event.userId, event.newBalance, "SPEND_EVENT");
        } catch (error) {
            // Non-critical — log and move on
            console.error("[AutoReplenish] Listener error:", error);
        }
    });

    registered = true;
    console.log("[AutoReplenish] Listener registered for TOKEN_SPENT events");
}
