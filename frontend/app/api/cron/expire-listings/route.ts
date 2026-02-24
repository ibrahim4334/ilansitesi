import { NextResponse } from "next/server";
import { runExpiration } from "@/lib/expiration-service";

/**
 * GET /api/cron/expire-listings
 *
 * HTTP endpoint for triggering expiration.
 * Use cases:
 *   - Vercel cron (vercel.json)
 *   - External cron service (Upstash, Railway, etc.)
 *   - Manual trigger from admin panel
 *
 * Security: Protected by CRON_SECRET header in production.
 */
export async function GET(req: Request) {
    // ── Auth ────────────────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === "production") {
        if (!cronSecret) {
            console.error("[Cron] CRON_SECRET not configured");
            return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
        }
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    // ── Execute ─────────────────────────────────────────────────────
    try {
        const result = await runExpiration();

        return NextResponse.json({
            ok: true,
            ...result,
            executedAt: new Date().toISOString(),
        });
    } catch (err: any) {
        console.error("[Cron] expire-listings failed:", err);
        return NextResponse.json({
            ok: false,
            error: process.env.NODE_ENV === "production"
                ? "Expiration job failed"
                : err.message,
        }, { status: 500 });
    }
}
