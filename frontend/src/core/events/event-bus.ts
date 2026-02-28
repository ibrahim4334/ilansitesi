// ─── In-Memory Event Bus ────────────────────────────────────────────────
// Decoupled event system for domain events.
// Today: in-memory. Tomorrow: RabbitMQ / Redis Streams / SQS.
//
// Usage:
//   EventBus.emit("OFFER_CREATED", { offerId, guideId, demandId });
//   EventBus.on("OFFER_CREATED", async (data) => { ... });

export type EventName =
    | "OFFER_CREATED"
    | "OFFER_ACCEPTED"
    | "OFFER_REJECTED"
    | "OFFER_EXPIRED"
    | "LISTING_CREATED"
    | "LISTING_EXPIRED"
    | "LISTING_REPUBLISHED"
    | "LISTING_BOOSTED"
    | "DEMAND_CREATED"
    | "DEMAND_EXPIRED"
    | "TOKEN_SPENT"
    | "TOKEN_GRANTED"
    | "TOKEN_RENEWED"
    | "PACKAGE_UPGRADED"
    | "PACKAGE_DOWNGRADED"
    | "PLAN_UPGRADED"
    | "PLAN_DOWNGRADE_SCHEDULED"
    | "PLAN_FROZEN"
    | "IDENTITY_APPROVED"
    | "IDENTITY_REVOKED"
    // Auto-replenish events
    | "AUTO_REPLENISH_CONFIGURED"
    | "AUTO_REPLENISH_SUCCESS"
    | "AUTO_REPLENISH_ALERT"
    | "AUTO_REPLENISH_SUSPENDED"
    // Advanced monetization events
    | "DYNAMIC_PRICE_APPLIED"
    | "CREDIT_LINE_DRAWN"
    | "CREDIT_LINE_REPAID"
    | "PERFORMANCE_TIER_CHANGED";

type EventHandler<T = any> = (data: T) => Promise<void>;

class InMemoryEventBus {
    private handlers = new Map<string, EventHandler[]>();

    /**
     * Subscribe to an event.
     */
    on<T = any>(event: EventName, handler: EventHandler<T>): void {
        const existing = this.handlers.get(event) || [];
        existing.push(handler as EventHandler);
        this.handlers.set(event, existing);
    }

    /**
     * Remove a handler.
     */
    off(event: EventName, handler: EventHandler): void {
        const existing = this.handlers.get(event) || [];
        this.handlers.set(
            event,
            existing.filter((h) => h !== handler),
        );
    }

    /**
     * Emit an event. All handlers run concurrently.
     * Errors are caught and logged — they never break the caller.
     */
    async emit<T = any>(event: EventName, data: T): Promise<void> {
        const handlers = this.handlers.get(event) || [];
        if (handlers.length === 0) return;

        const results = await Promise.allSettled(
            handlers.map((handler) => handler(data)),
        );

        for (const result of results) {
            if (result.status === "rejected") {
                console.error(`[EventBus] Handler failed for ${event}:`, result.reason);
            }
        }
    }

    /**
     * Get registered event count (for debugging).
     */
    listenerCount(event: EventName): number {
        return (this.handlers.get(event) || []).length;
    }

    /**
     * Clear all handlers (for testing).
     */
    clear(): void {
        this.handlers.clear();
    }
}

// Singleton
export const EventBus = new InMemoryEventBus();
