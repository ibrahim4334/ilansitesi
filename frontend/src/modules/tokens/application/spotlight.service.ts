// ─── Spotlight Service ───────────────────────────────────────────────────
// Premium placement feature: 3 fixed slots per city, hourly rotation.
//
// DESIGN PRINCIPLES:
//   1. SEPARATE from ranking — does NOT modify ranking scores
//   2. Trust-gated — minimum trust 55 required
//   3. Fair rotation — hourly shuffling prevents monopolization
//   4. City-scoped — agencies compete within their city, not globally
//   5. Transparent — "Öne Çıkan / Spotlight" label on UI
//
// Placement logic:
//   - 3 slots per city per rotation window (1 hour)
//   - If ≤3 requests → all get placed
//   - If >3 requests → priority by trust score (meritocratic queue)
//   - Same agency can't hold >1 slot in same city/window
//   - Minimum trust gate: 55 (prevents low-quality agencies from appearing)
//
// UI integration:
//   Spotlight sits ABOVE organic results as a visually separated banner:
//   ┌─────────────────────────────────────────────┐
//   │  ⭐ Öne Çıkan Rehberler (Sponsored)         │
//   │  [Card 1]  [Card 2]  [Card 3]               │
//   └─────────────────────────────────────────────┘
//   ─── Normal ranking results below ──────────────

import { prisma } from "@/lib/prisma";
import { TOKEN_COSTS, PackageSystem } from "@/lib/package-system";
import { spendToken } from "./spend-token.usecase";
import { EventBus } from "@/src/core/events/event-bus";

// ─── Constants ──────────────────────────────────────────────────────────

const SPOTLIGHT_SLOTS_PER_CITY = 3;
const SPOTLIGHT_DURATION_HOURS = 1;    // Each spotlight lasts 1 rotation window
const SPOTLIGHT_TRUST_GATE = 55;       // Minimum trust score
const MAX_SPOTLIGHTS_PER_AGENCY_PER_CITY = 1; // 1 slot per agency per city per window

// ─── Types ──────────────────────────────────────────────────────────────

export interface SpotlightResult {
    ok: boolean;
    slotIndex: number;
    expiresAt: Date;
    tokenCost: number;
    error?: string;
}

export interface SpotlightListing {
    listingId: string;
    userId: string;
    city: string;
    slotIndex: number;
    expiresAt: Date;
}

// ─── Get Current Rotation Group ─────────────────────────────────────────

function currentRotationGroup(): string {
    return new Date().toISOString().slice(0, 13); // "2026-02-28T15"
}

function nextRotationExpiry(): Date {
    const now = new Date();
    const next = new Date(now);
    next.setHours(next.getHours() + SPOTLIGHT_DURATION_HOURS);
    next.setMinutes(0, 0, 0); // Snap to hour boundary
    return next;
}

// ─── Request Spotlight ──────────────────────────────────────────────────

/**
 * Request a spotlight placement for a listing.
 *
 * Rules:
 *   1. Package must allow spotlights (PRO+, CORP_BASIC+)
 *   2. Trust score ≥ 55
 *   3. Max 1 spotlight per agency per city per rotation
 *   4. 3 slots per city — if full, queued to next rotation
 *   5. Token cost: dynamically loaded from TOKEN_COSTS.SPOTLIGHT
 */
export async function requestSpotlight(
    userId: string,
    listingId: string,
    city: string,
    idempotencyKey: string,
): Promise<SpotlightResult> {
    // ── 1. Validate user eligibility ────────────────────────────────
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            packageType: true,
            trustScore: true,
        },
    });

    if (!user) return { ok: false, slotIndex: -1, expiresAt: new Date(), tokenCost: 0, error: "User not found" };

    // Package check
    if (!PackageSystem.canSpotlight(user.packageType)) {
        return {
            ok: false, slotIndex: -1, expiresAt: new Date(), tokenCost: 0,
            error: `Spotlight requires PRO or higher plan. Current: ${user.packageType}`,
        };
    }

    // Trust gate
    if (user.trustScore < SPOTLIGHT_TRUST_GATE) {
        return {
            ok: false, slotIndex: -1, expiresAt: new Date(), tokenCost: 0,
            error: `Spotlight requires trust ≥ ${SPOTLIGHT_TRUST_GATE}. Current: ${user.trustScore}`,
        };
    }

    // ── 2. Check slot availability ──────────────────────────────────
    const rotation = currentRotationGroup();
    const expiresAt = nextRotationExpiry();

    // Count active spotlights in this city/rotation
    const activeInCity = await prisma.spotlightPlacement.count({
        where: {
            city,
            rotationGroup: rotation,
            status: "ACTIVE",
        },
    });

    if (activeInCity >= SPOTLIGHT_SLOTS_PER_CITY) {
        return {
            ok: false, slotIndex: -1, expiresAt, tokenCost: 0,
            error: `All ${SPOTLIGHT_SLOTS_PER_CITY} spotlight slots are filled for ${city}. Try next hour.`,
        };
    }

    // Check agency already has a slot in this city/rotation
    const agencyHasSlot = await prisma.spotlightPlacement.count({
        where: {
            userId,
            city,
            rotationGroup: rotation,
            status: "ACTIVE",
        },
    });

    if (agencyHasSlot >= MAX_SPOTLIGHTS_PER_AGENCY_PER_CITY) {
        return {
            ok: false, slotIndex: -1, expiresAt, tokenCost: 0,
            error: "You already have a spotlight in this city for the current hour.",
        };
    }

    // ── 3. Charge tokens ────────────────────────────────────────────
    const tokenCost = TOKEN_COSTS.SPOTLIGHT;

    const spendResult = await spendToken({
        userId,
        action: "SPOTLIGHT",
        relatedId: listingId,
        reason: `Spotlight placement: ${city} slot`,
        idempotencyKey: `spotlight-spend:${idempotencyKey}`,
    });

    if (!spendResult.ok) {
        return {
            ok: false, slotIndex: -1, expiresAt, tokenCost,
            error: spendResult.error || "Insufficient tokens",
        };
    }

    // ── 4. Create placement ─────────────────────────────────────────
    const slotIndex = activeInCity; // Next available slot (0, 1, or 2)

    await prisma.spotlightPlacement.create({
        data: {
            listingId,
            userId,
            city,
            slotIndex,
            startsAt: new Date(),
            expiresAt,
            rotationGroup: rotation,
            tokenCost,
            status: "ACTIVE",
            idempotencyKey: `spotlight-place:${idempotencyKey}`,
        },
    });

    EventBus.emit("LISTING_BOOSTED", {
        listingId,
        userId,
        type: "SPOTLIGHT",
        city,
        slotIndex,
        expiresAt,
    });

    return { ok: true, slotIndex, expiresAt, tokenCost };
}

// ─── Get Active Spotlights (for UI rendering) ───────────────────────────

/**
 * Fetch active spotlight listings for a city.
 * Called by search results page to render the spotlight banner.
 *
 * Returns up to 3 listings, ordered by trust score (meritocratic).
 */
export async function getActiveSpotlights(city: string): Promise<SpotlightListing[]> {
    const now = new Date();

    const spotlights = await prisma.spotlightPlacement.findMany({
        where: {
            city,
            status: "ACTIVE",
            expiresAt: { gt: now },
        },
        orderBy: { slotIndex: "asc" },
        take: SPOTLIGHT_SLOTS_PER_CITY,
    });

    return spotlights.map(s => ({
        listingId: s.listingId,
        userId: s.userId,
        city: s.city,
        slotIndex: s.slotIndex,
        expiresAt: s.expiresAt,
    }));
}

// ─── Track Spotlight Performance ────────────────────────────────────────

/**
 * Record an impression or click on a spotlight.
 * Called from frontend tracking endpoints.
 */
export async function trackSpotlightEvent(
    spotlightId: string,
    event: "IMPRESSION" | "CLICK",
): Promise<void> {
    await prisma.spotlightPlacement.update({
        where: { id: spotlightId },
        data: event === "IMPRESSION"
            ? { impressions: { increment: 1 } }
            : { clicks: { increment: 1 } },
    }).catch(() => {
        // Non-critical — tracking failure shouldn't break UX
    });
}

// ─── Expire Old Spotlights (Cron) ───────────────────────────────────────

/**
 * Mark expired spotlights. Run every 5 minutes via cron.
 */
export async function expireSpotlights(): Promise<number> {
    const result = await prisma.spotlightPlacement.updateMany({
        where: {
            status: "ACTIVE",
            expiresAt: { lte: new Date() },
        },
        data: { status: "EXPIRED" },
    });
    return result.count;
}
