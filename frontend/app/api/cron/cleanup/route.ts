import { NextResponse } from "next/server";
import { runDataCleanup } from "@/lib/data-cleanup";

/**
 * GET /api/cron/cleanup
 *
 * Data retention cleanup — deletes old analytics and rate-limiting records.
 *
 * Use cases:
 *   - Coolify / external cron (daily)
 *   - node-cron via cron-runner.ts
 *   - Manual trigger from admin panel
 *
 * Security: Protected by CRON_SECRET header.
 *
 * Targets:
 *   - ListingImpression: 30 days
 *   - ListingClick: 30 days
 *   - VelocityCounter: 7 days
 */
export async function GET(req: Request) {
    // ── Auth ────────────────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === "production") {
        if (!cronSecret) {
            console.error("[Cron/Cleanup] CRON_SECRET not configured");
            return NextResponse.json(
                { error: "Server misconfiguration" },
                { status: 500 }
            );
        }
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
    }

    // ── Execute Cleanup ─────────────────────────────────────────────
    try {
        const result = await runDataCleanup();

        return NextResponse.json({
            ok: true,
            deleted: result,
            retentionPolicy: {
                analytics: "30 days",
                velocityCounters: "7 days",
            },
        });
    } catch (err: any) {
        console.error("[Cron/Cleanup] Failed:", err);
        return NextResponse.json(
            {
                ok: false,
                error:
                    process.env.NODE_ENV === "production"
                        ? "Cleanup job failed"
                        : err.message,
            },
            { status: 500 }
        );
    }
}
