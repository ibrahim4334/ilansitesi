import { prisma } from "@/lib/prisma";

/**
 * Ledger Drift Check — scheduled job.
 * Run daily via cron (e.g. Vercel Cron, node-cron, or external scheduler).
 *
 * Detects and optionally auto-repairs any divergence between:
 *   users.tokenBalance (cache)  vs  SUM(token_ledger_entries.amount) (truth)
 *
 * This is a SAFETY NET — if the invariant holds, this job finds nothing.
 * If drift is detected, it means a bug bypassed grantToken/spendToken.
 */

interface DriftResult {
    userId: string;
    email: string | null;
    cached: number;
    ledger: number;
    drift: number;
}

export async function checkLedgerDrift(autoRepair: boolean = false): Promise<{
    checked: number;
    drifted: number;
    repaired: number;
    unseeded: number;
    details: DriftResult[];
}> {
    console.log("[LedgerDrift] Starting drift check...");

    // ── Check 1: Balance drift (cache ≠ ledger SUM) ─────────────────
    const drifted = await prisma.$queryRaw<DriftResult[]>`
        SELECT
            u.id AS userId,
            u.email,
            u.availableBalance AS cached,
            COALESCE(SUM(t.amount), 0) AS ledger,
            u.availableBalance - COALESCE(SUM(t.amount), 0) AS drift
        FROM users u
        LEFT JOIN token_ledger_entries t ON t.userId = u.id
        GROUP BY u.id
        HAVING u.availableBalance != COALESCE(SUM(t.amount), 0)
    `;

    // ── Check 2: Users without any ledger entry (invariant #5) ──────
    const unseeded = await prisma.$queryRaw<{ id: string; email: string | null }[]>`
        SELECT u.id, u.email
        FROM users u
        WHERE NOT EXISTS (
            SELECT 1 FROM token_ledger_entries t WHERE t.userId = u.id
        )
    `;

    const totalUsers = await prisma.user.count();
    let repaired = 0;

    if (drifted.length > 0) {
        console.error(`[LedgerDrift] ⚠️ DRIFT DETECTED: ${drifted.length} users`);
        for (const d of drifted) {
            console.error(`  - ${d.userId} (${d.email}): cached=${d.cached}, ledger=${d.ledger}, drift=${d.drift}`);
        }

        if (autoRepair) {
            console.log("[LedgerDrift] Auto-repairing: setting cache = SUM(ledger)...");
            for (const d of drifted) {
                await prisma.$executeRaw`
                    UPDATE users SET availableBalance = ${Number(d.ledger)}
                    WHERE id = ${d.userId}
                `;
                repaired++;
            }
            console.log(`[LedgerDrift] Repaired ${repaired} users.`);
        }
    } else {
        console.log("[LedgerDrift] ✅ No drift detected.");
    }

    if (unseeded.length > 0) {
        console.error(`[LedgerDrift] ⚠️ UNSEEDED USERS: ${unseeded.length}`);
        for (const u of unseeded) {
            console.error(`  - ${u.id} (${u.email}): no ledger entries`);
        }

        if (autoRepair) {
            console.log("[LedgerDrift] Seeding missing ledger entries...");
            for (const u of unseeded) {
                const user = await prisma.user.findUnique({
                    where: { id: u.id },
                    select: { tokenBalance: true },
                });
                const balance = user?.tokenBalance ?? 0;

                try {
                    await prisma.tokenTransaction.create({
                        data: {
                            userId: u.id,
                            entryType: "ADJUSTMENT",
                            amount: balance,
                            idempotencyKey: `ledger-seed:${u.id}`,
                            reasonCode: "INITIAL_BALANCE",
                        },
                    });
                    repaired++;
                } catch (e: any) {
                    if (e.code === "P2002") continue; // Already seeded
                    throw e;
                }
            }
            console.log(`[LedgerDrift] Seeded ${repaired} users.`);
        }
    } else {
        console.log("[LedgerDrift] ✅ All users have ledger entries.");
    }

    return {
        checked: totalUsers,
        drifted: drifted.length,
        repaired,
        unseeded: unseeded.length,
        details: drifted,
    };
}
