// ─── Token Guard ────────────────────────────────────────────────────────
// Pre-validates token balance and daily cap before any token-spending action.
// Used by controllers before calling use-cases.

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { TOKEN_COSTS, DAILY_CAPS } from "@/lib/package-system";
import { getRoleConfig } from "@/lib/role-config";
import type { PackageType } from "@/lib/db-types";

export type TokenAction = keyof typeof TOKEN_COSTS;

interface TokenGuardResult {
    ok: boolean;
    cost: number;
    balance: number;
    error?: NextResponse;
}

/**
 * Full pre-check for a token-spending action.
 *
 * 1. Role permission check
 * 2. Daily cap check
 * 3. Balance check
 *
 * NOTE: This is a pre-check only. The actual deduction
 * happens inside a SERIALIZABLE transaction (double-spend safe).
 */
export async function requireTokens(
    userId: string,
    role: string,
    packageType: string,
    action: TokenAction,
): Promise<TokenGuardResult> {
    const cost = TOKEN_COSTS[action];

    // ── 1. Role permission ──────────────────────────────────────────
    const roleConfig = getRoleConfig(role);
    const actionPermissionMap: Record<TokenAction, boolean> = {
        OFFER_SEND: roleConfig.canSendOffer,
        DEMAND_UNLOCK: roleConfig.canUnlockDemand,
        BOOST: roleConfig.canBoostListing,
        SPOTLIGHT: roleConfig.canSpotlight,
        REPUBLISH: roleConfig.canRepublish,
        REFRESH: roleConfig.canRefresh,
    };

    if (!actionPermissionMap[action]) {
        return {
            ok: false,
            cost,
            balance: 0,
            error: NextResponse.json({
                error: "Bu işlem rolünüzde mevcut değil",
                action,
                role,
                code: "ROLE_NOT_PERMITTED",
            }, { status: 403 }),
        };
    }

    // ── 2. Daily cap ────────────────────────────────────────────────
    const caps = DAILY_CAPS[packageType as PackageType] || DAILY_CAPS.FREE;
    const capMap: Partial<Record<TokenAction, number>> = {
        OFFER_SEND: caps.offers,
        DEMAND_UNLOCK: caps.unlocks,
        BOOST: caps.boosts,
        SPOTLIGHT: caps.spotlights,
    };

    const dailyLimit = capMap[action];
    if (dailyLimit !== undefined) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayCount = await prisma.tokenTransaction.count({
            where: {
                userId,
                type: action,
                createdAt: { gte: startOfDay },
            },
        });

        if (todayCount >= dailyLimit) {
            return {
                ok: false,
                cost,
                balance: 0,
                error: NextResponse.json({
                    error: "Günlük limit doldu",
                    action,
                    limit: dailyLimit,
                    used: todayCount,
                    code: "DAILY_CAP_REACHED",
                }, { status: 429 }),
            };
        }
    }

    // ── 3. Balance check (cached — not authoritative) ───────────────
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tokenBalance: true },
    });

    const balance = user?.tokenBalance ?? 0;
    if (balance < cost) {
        return {
            ok: false,
            cost,
            balance,
            error: NextResponse.json({
                error: "Yetersiz token",
                required: cost,
                current: balance,
                code: "INSUFFICIENT_TOKENS",
            }, { status: 402 }),
        };
    }

    return { ok: true, cost, balance };
}
