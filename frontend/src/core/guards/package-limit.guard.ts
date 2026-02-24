// ─── Package Limit Guard ────────────────────────────────────────────────
// Enforces package-based limits (listing count, daily offers, boosts).

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PackageSystem, DAILY_CAPS } from "@/lib/package-system";
import type { PackageType } from "@/lib/db-types";

interface PackageGuardResult {
    ok: boolean;
    error?: NextResponse;
    remaining?: number;
}

/**
 * Check active listing count against package limit.
 */
export async function checkListingLimit(
    userId: string,
    packageType: string,
): Promise<PackageGuardResult> {
    const activeCount = await prisma.listing.count({
        where: { ownerId: userId, status: "ACTIVE", deletedAt: null },
    });
    const limits = PackageSystem.getLimits(packageType);

    if (activeCount >= limits.maxListings) {
        return {
            ok: false,
            remaining: 0,
            error: NextResponse.json({
                error: "İlan limiti doldu",
                limit: limits.maxListings,
                current: activeCount,
                code: "LISTING_LIMIT_REACHED",
            }, { status: 403 }),
        };
    }

    return { ok: true, remaining: limits.maxListings - activeCount };
}

/**
 * Check daily action count against package cap.
 */
export async function checkDailyCap(
    userId: string,
    packageType: string,
    action: "offers" | "unlocks" | "boosts" | "spotlights",
): Promise<PackageGuardResult> {
    const caps = DAILY_CAPS[packageType as PackageType] || DAILY_CAPS.FREE;
    const limit = caps[action];

    if (limit === 0) {
        return {
            ok: false,
            remaining: 0,
            error: NextResponse.json({
                error: `Bu işlem paketinizde mevcut değil`,
                action,
                code: "ACTION_NOT_AVAILABLE",
            }, { status: 403 }),
        };
    }

    // Count today's actions
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let todayCount = 0;

    if (action === "offers") {
        todayCount = await prisma.offer.count({
            where: { guideId: userId, createdAt: { gte: startOfDay } },
        });
    } else if (action === "boosts" || action === "spotlights") {
        const type = action === "boosts" ? "BOOST" : "SPOTLIGHT";
        todayCount = await prisma.tokenTransaction.count({
            where: { userId, type, createdAt: { gte: startOfDay } },
        });
    } else if (action === "unlocks") {
        todayCount = await prisma.tokenTransaction.count({
            where: { userId, type: "DEMAND_UNLOCK", createdAt: { gte: startOfDay } },
        });
    }

    if (todayCount >= limit) {
        return {
            ok: false,
            remaining: 0,
            error: NextResponse.json({
                error: "Günlük limit doldu",
                action,
                limit,
                used: todayCount,
                code: "DAILY_CAP_REACHED",
            }, { status: 429 }),
        };
    }

    return { ok: true, remaining: limit - todayCount };
}

/**
 * Check boost limit (concurrent boosted listings).
 */
export async function checkBoostLimit(
    userId: string,
    packageType: string,
): Promise<PackageGuardResult> {
    const limits = PackageSystem.getLimits(packageType);

    if (limits.maxBoosts === 0) {
        return {
            ok: false,
            remaining: 0,
            error: NextResponse.json({
                error: "Boost bu pakette mevcut değil",
                code: "BOOST_NOT_AVAILABLE",
            }, { status: 403 }),
        };
    }

    const activeBoosted = await prisma.listing.count({
        where: {
            ownerId: userId,
            isFeatured: true,
            featuredUntil: { gt: new Date() },
        },
    });

    if (activeBoosted >= limits.maxBoosts) {
        return {
            ok: false,
            remaining: 0,
            error: NextResponse.json({
                error: "Maksimum boost sayısına ulaştınız",
                limit: limits.maxBoosts,
                current: activeBoosted,
                code: "BOOST_LIMIT_REACHED",
            }, { status: 403 }),
        };
    }

    return { ok: true, remaining: limits.maxBoosts - activeBoosted };
}
