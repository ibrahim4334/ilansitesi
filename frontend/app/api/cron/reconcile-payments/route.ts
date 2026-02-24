import { NextResponse } from "next/server";
import { reconcilePendingPayments } from "@/lib/jobs/reconcile-pending-payments";

/**
 * GET /api/cron/reconcile-payments
 *
 * Reconciles stale pending payment transactions.
 * Should be called every 10-15 minutes by a cron scheduler.
 *
 * Security: Protected by CRON_SECRET header.
 * Add to vercel.json:
 *   "crons": [{ "path": "/api/cron/reconcile-payments", "schedule": "* /15 * * * *" }]
 *   (Vercel crons automatically supply Authorization: Bearer <CRON_SECRET>)
 */
export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Require CRON_SECRET in production
    if (process.env.NODE_ENV === "production") {
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const result = await reconcilePendingPayments();
        return NextResponse.json({ ok: true, ...result });
    } catch (err: any) {
        console.error("[Cron] reconcile-payments failed:", err);
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}
