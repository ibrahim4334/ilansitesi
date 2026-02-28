// ─── Device Fingerprint Collector ────────────────────────────────────────
// Records device fingerprints for Sybil detection and network scoring.
// Called from API routes (fire-and-forget, no blocking).

import { prisma } from "@/lib/prisma";

/**
 * Record a device fingerprint for a user.
 * Fire-and-forget — do NOT await in hot path.
 */
export async function collectFingerprint(
    userId: string,
    fingerprint: string,
    ipAddress: string,
    userAgent: string,
): Promise<void> {
    try {
        // Deduplicate: don't record same fingerprint+IP combo within 1 hour
        const oneHourAgo = new Date(Date.now() - 3600 * 1000);
        const recent = await prisma.deviceFingerprint.findFirst({
            where: {
                userId,
                fingerprint,
                ipAddress,
                createdAt: { gte: oneHourAgo },
            },
        });

        if (recent) return; // Already recorded recently

        await prisma.deviceFingerprint.create({
            data: { userId, fingerprint, ipAddress, userAgent },
        });
    } catch (error) {
        // Never block the request on fingerprint collection failure
        console.error("[Fingerprint] Collection failed:", error);
    }
}

/**
 * Extract IP address from request headers.
 * Handles common proxy setups (Vercel, Cloudflare, etc.)
 */
export function extractIP(request: Request): string {
    const headers = new Headers(request.headers);
    return (
        headers.get("x-real-ip") ||
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("cf-connecting-ip") ||
        "unknown"
    );
}
