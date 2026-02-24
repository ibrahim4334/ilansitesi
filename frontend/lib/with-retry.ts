/**
 * SERIALIZABLE transaction sonucunu döndürür.
 * MySQL deadlock veya lock timeout alınırsa üstel geri çekilme ile yeniden dener.
 *
 * Prisma hata kodu P2034 = serialization failure (deadlock dahil).
 */
export async function withSerializableRetry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3
): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const isRetryable =
                err.code === "P2034" ||                         // Prisma serialization failure
                err.message?.includes("deadlock") ||
                err.message?.includes("lock wait timeout");

            if (isRetryable && attempt < maxAttempts) {
                await new Promise(r => setTimeout(r, 100 * attempt)); // 100ms → 200ms
                continue;
            }
            throw err;
        }
    }
    throw new Error("Max retries exceeded");
}
