/**
 * In-memory sliding-window rate limiter.
 * For production at 50k+ users, replace with Redis (ioredis + sliding window).
 */
const store = new Map<string, number[]>();

export function rateLimit(
    key: string,
    windowMs: number = 60_000,
    maxRequests: number = 30
): { success: boolean; remaining: number } {
    const now = Date.now();
    const timestamps = store.get(key) || [];

    // Prune expired entries
    const valid = timestamps.filter(t => now - t < windowMs);

    if (valid.length >= maxRequests) {
        store.set(key, valid);
        return { success: false, remaining: 0 };
    }

    valid.push(now);
    store.set(key, valid);

    // Periodic cleanup (every 10k entries)
    if (store.size > 10_000) {
        for (const [k, v] of store) {
            const cleaned = v.filter(t => now - t < windowMs);
            if (cleaned.length === 0) store.delete(k);
            else store.set(k, cleaned);
        }
    }

    return { success: true, remaining: maxRequests - valid.length };
}
