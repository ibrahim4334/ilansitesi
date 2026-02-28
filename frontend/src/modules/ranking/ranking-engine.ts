// ─── Deterministic Ranking Engine v3 ────────────────────────────────────
// 6-factor weighted formula on a 1000-point scale.
// Boost is percentage-capped (≤20% of organic) — cannot override trust.
// Trust-gated boost tiers prevent pay-to-win.
//
// Factors:
//   Quality       (30%)  — Conversion + profile + trips + activity
//   Trust         (25%)  — Unified 0-100 score, risk tier overrides
//   ReviewQuality (20%)  — Rating + volume + concentration penalty
//   SLA           (10%)  — Response time tiers
//   Activity      ( 8%)  — Recent engagement
//   Freshness     ( 7%)  — Recency + cold-start bonus
//
// Architecture:
//   scoreListing()   → pure function, O(1) per listing
//   rankListings()   → batch sort with EMA smoothing, O(N log N)
//   detectQueryIntent() → search parameter inference

import type { ConversionMetrics } from "./conversion-tracker";

// ─── Input Types ────────────────────────────────────────────────────────

export interface RankingListingInput {
    id: string;
    type: "GUIDE_PROFILE" | "CORPORATE_TOUR";
    createdAt: Date;
    updatedAt: Date;
    filled: number;
    quota: number;
    price: number;
    city: string;
}

export interface RankingGuideInput {
    userId: string;
    packageType: string;
    isIdentityVerified: boolean;
    trustScore: number;       // Int 0–100
    completedTrips: number;
    profileCompleteness: number; // 0–100
    avgResponseHours: number;
    recentActivityCount: number; // Last 30 days
    riskTier?: string;        // GREEN | YELLOW | ORANGE | RED | BLACK
    avgReviewRating: number;  // 0–5
    reviewCount: number;
    concentrationPenalty?: number; // 0.0–0.60, from review-concentration.ts
    accountAgeDays: number;
    totalListingsCreated: number;
}

export interface RankingBoostInput {
    isActive: boolean;
    effectivePower: number;   // 0.0–1.0 (already decayed by duration)
    activeBoostCount: number;
    boostTier?: "BASIC" | "PREMIUM" | "ELITE";
}

export interface PersonalizationInput {
    userId: string | null;
    preferredPriceMin?: number;
    preferredPriceMax?: number;
    searchedCities?: string[];
    clickedListingIds?: string[];
    ignoredListingIds?: string[];
}

export interface QueryIntentInput {
    type: "BROWSE" | "PRICE_SENSITIVE" | "QUALITY_SEEKING" | "DATE_SPECIFIC" | "LOCATION_SPECIFIC";
}

// ─── Weight Constants ───────────────────────────────────────────────────

const SCALE = 1000;

const WEIGHTS = {
    quality: 0.30,
    trust: 0.25,
    reviewQuality: 0.17,
    sla: 0.10,
    activity: 0.08,
    freshness: 0.10,
} as const;

// Boost HARD percentage cap — can NEVER exceed 18% of organic score
// Tuned from 0.20 → 0.18 (2026-02-28): −5.4% token revenue, +4% fairness
const BOOST_CAP_RATIO = 0.18;

// Boost tier trust gates
const BOOST_TRUST_GATES = {
    BASIC: 40,
    PREMIUM: 60,
    ELITE: 75,
} as const;

// Cold-start configuration
const COLD_START_DAYS = 14;
const COLD_START_BONUS = 0.40; // Added to freshness (capped at 1.0)

// Personalization range (±100 points on 1000-point scale)
const PERSONALIZATION_RANGE = 100;

// EMA smoothing factor
const EMA_ALPHA = 0.3;

// Query intent weight modifiers
const INTENT_MODIFIERS: Record<string, {
    quality: number; trust: number; freshness: number; personalization: number;
}> = {
    BROWSE: { quality: 1.0, trust: 1.0, freshness: 1.2, personalization: 1.0 },
    PRICE_SENSITIVE: { quality: 0.8, trust: 0.7, freshness: 1.0, personalization: 1.3 },
    QUALITY_SEEKING: { quality: 1.3, trust: 1.5, freshness: 0.8, personalization: 0.8 },
    DATE_SPECIFIC: { quality: 1.0, trust: 1.0, freshness: 1.5, personalization: 1.0 },
    LOCATION_SPECIFIC: { quality: 1.0, trust: 1.0, freshness: 1.0, personalization: 1.5 },
};

// ─── Helpers ────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

// ─── Factor 1: Quality Score (0.0 – 1.0) ───────────────────────────────

export function computeQuality(
    guide: RankingGuideInput,
    conversion: ConversionMetrics | null,
): number {
    // 1a. Conversion score (max 0.40 = 40% of quality)
    let conversionScore = 0;
    if (conversion && conversion.impressions > 10) {
        const ctrComponent = clamp(conversion.ctr * 2500, 0, 0.30);
        const dwellComponent = clamp(conversion.avgDwellTimeMs / 120_000, 0, 0.10);
        conversionScore = ctrComponent + dwellComponent;
    }

    // 1b. Profile completeness (max 0.20)
    const profileScore = (guide.profileCompleteness / 100) * 0.20;

    // 1c. Completed trips (max 0.20) — logarithmic: diminishing returns
    const tripScore = clamp(Math.log2(guide.completedTrips + 1) / 4, 0, 0.20);

    // 1d. Recent activity (max 0.20)
    const activityScore = clamp(guide.recentActivityCount / 30, 0, 0.20);

    return clamp(conversionScore + profileScore + tripScore + activityScore, 0, 1);
}

// ─── Factor 2: Trust Score (0.0 – 1.0) ─────────────────────────────────

export function computeTrust(guide: RankingGuideInput): number {
    // Risk tier overrides — hard enforcement
    if (guide.riskTier === "RED" || guide.riskTier === "BLACK") return 0;
    if (guide.riskTier === "ORANGE") return 0.25;
    if (guide.riskTier === "YELLOW") return clamp(guide.trustScore / 100, 0, 0.65);

    // Normal: direct mapping from 0-100 → 0.0-1.0
    let base = guide.trustScore / 100;

    // Identity verified bonus (+0.10, capped at 1.0)
    if (guide.isIdentityVerified) {
        base = Math.min(1.0, base + 0.10);
    }

    return clamp(base, 0, 1);
}

export function isColdStartEligible(guide: RankingGuideInput): boolean {
    return guide.isIdentityVerified &&
        guide.accountAgeDays <= COLD_START_DAYS &&
        guide.totalListingsCreated <= 3;
}

// ─── Factor 3: Review Quality (0.0 – 1.0) ──────────────────────────────

export function computeReviewQuality(guide: RankingGuideInput, listing?: RankingListingInput): number {
    if (guide.reviewCount === 0) {
        // Verified newcomer floor logic: Account-based to prevent delete/recreate abuse
        if (isColdStartEligible(guide)) {
            return 0.40; // Artificial floor for first 14 days
        }
        return 0;
    }

    // 3a. Rating score (max 0.60) — direct mapping from 0-5 star
    const ratingScore = (guide.avgReviewRating / 5.0) * 0.60;

    // 3b. Volume score (max 0.25) — logarithmic: 1=0, 2=5%, 8=15%, 32=25%
    const volumeScore = clamp(Math.log2(guide.reviewCount + 1) / 5, 0, 0.25);

    // 3c. Diversity bonus (0.15 if 5+ reviews)
    const diversityBonus = guide.reviewCount >= 5 ? 0.15 : 0;

    const raw = clamp(ratingScore + volumeScore + diversityBonus, 0, 1);

    // Apply review concentration penalty (from review-concentration.ts)
    // concentrationPenalty: 0.0=clean, up to 0.60=heavy farm
    const penalty = guide.concentrationPenalty ?? 0;
    return raw * (1 - penalty);
}

// ─── Factor 4: SLA Score (0.0 – 1.0) ───────────────────────────────────

export function computeSLA(guide: RankingGuideInput): number {
    const hrs = guide.avgResponseHours;
    if (hrs <= 1) return 1.0;
    if (hrs <= 4) return 0.80;
    if (hrs <= 12) return 0.50;
    if (hrs <= 24) return 0.30;
    return 0.10;
}

// ─── Factor 5: Activity Score (0.0 – 1.0) ──────────────────────────────

export function computeActivity(guide: RankingGuideInput): number {
    return clamp(guide.recentActivityCount / 30, 0, 1);
}

// ─── Factor 6: Freshness Score (0.0 – 1.0) ─────────────────────────────

export function computeFreshness(listing: RankingListingInput, guide: RankingGuideInput): number {
    const now = Date.now();
    const daysSinceUpdate = (now - listing.updatedAt.getTime()) / 86_400_000;

    // Recency tiers
    let recency: number;
    if (daysSinceUpdate <= 1) recency = 1.0;
    else if (daysSinceUpdate <= 7) recency = 0.80;
    else if (daysSinceUpdate <= 30) recency = 0.50;
    else if (daysSinceUpdate <= 90) recency = 0.30;
    else recency = 0.10;

    // Cold-start bonus: Account-based (prevents delete/recreate abuse)
    let coldStartBonus = 0;
    if (isColdStartEligible(guide)) {
        coldStartBonus = COLD_START_BONUS * (1 - guide.accountAgeDays / COLD_START_DAYS);
    }

    return clamp(recency + coldStartBonus, 0, 1);
}

// ─── Boost Component ────────────────────────────────────────────────────

/**
 * Compute boost contribution.
 *
 * HARD RULES:
 * 1. BoostComponent ≤ 20% of OrganicScore (percentage cap)
 * 2. Trust < 40 → no boost effect
 * 3. Trust < 60 → Basic tier only
 * 4. Trust < 75 → Basic + Premium only
 * 5. Diminishing returns for multiple active boosts
 */
export function computeBoostComponent(
    organicScore: number,
    boost: RankingBoostInput,
    trustScore: number,
): number {
    if (!boost.isActive || organicScore <= 0) return 0;

    // Trust gate: trust < 40 gets no boost at all
    if (trustScore < BOOST_TRUST_GATES.BASIC) return 0;

    // Tier trust gate enforcement
    const tier = boost.boostTier || "BASIC";
    if (tier === "PREMIUM" && trustScore < BOOST_TRUST_GATES.PREMIUM) return 0;
    if (tier === "ELITE" && trustScore < BOOST_TRUST_GATES.ELITE) return 0;

    // Diminishing returns: 1st = 100%, 2nd = 50%, 3rd = 33%
    const diminishing = 1 / boost.activeBoostCount;

    // Raw lift: effectivePower (0-1, already decayed) × 200 × diminishing
    const rawLift = boost.effectivePower * 200 * diminishing;

    // PERCENTAGE CAP: boost NEVER exceeds 20% of organic score
    const maxAllowed = organicScore * BOOST_CAP_RATIO;

    return Math.round(Math.min(rawLift, maxAllowed));
}

// ─── Personalization Adjustment ─────────────────────────────────────────

export function computePersonalization(
    listing: RankingListingInput,
    personalization: PersonalizationInput | null,
): number {
    if (!personalization || !personalization.userId) return 0;

    let adjust = 0;

    // Price range match (±40)
    if (personalization.preferredPriceMin !== undefined && personalization.preferredPriceMax !== undefined) {
        if (listing.price >= personalization.preferredPriceMin &&
            listing.price <= personalization.preferredPriceMax) {
            adjust += 40;
        } else {
            const mid = (personalization.preferredPriceMin + personalization.preferredPriceMax) / 2;
            const distance = mid > 0 ? Math.abs(listing.price - mid) / mid : 0;
            adjust -= Math.min(40, Math.round(distance * 40));
        }
    }

    // City preference (+20)
    if (personalization.searchedCities?.includes(listing.city)) {
        adjust += 20;
    }

    // Click history boost (+30)
    if (personalization.clickedListingIds?.includes(listing.id)) {
        adjust += 30;
    }

    // Ignore penalty (-30)
    if (personalization.ignoredListingIds?.includes(listing.id)) {
        adjust -= 30;
    }

    return clamp(adjust, -PERSONALIZATION_RANGE, PERSONALIZATION_RANGE);
}

// ─── Fill Rate Penalty ──────────────────────────────────────────────────

function computeFillPenalty(listing: RankingListingInput): number {
    if (listing.quota <= 0) return 0;
    const fillRatio = listing.filled / listing.quota;
    // Full listings (100%) get -100 point penalty, proportional
    return Math.round(-100 * fillRatio);
}

// ─── Scoring Result ─────────────────────────────────────────────────────

export interface ScoringResult {
    listingId: string;
    finalScore: number;
    organicScore: number;
    boostComponent: number;
    qualityScore: number;
    trustScore: number;
    reviewQualityScore: number;
    slaScore: number;
    activityScore: number;
    freshnessScore: number;
    personalizationAdjust: number;
    fillPenalty: number;
    breakdown: string;
}

// ─── Composite Scorer ───────────────────────────────────────────────────

/**
 * Compute final ranking score for a single listing.
 * This is the core formula — pure function, O(1).
 *
 * FinalScore = OrganicScore + BoostComponent + Personalization + FillPenalty
 *
 * OrganicScore = (Quality×0.30 + Trust×0.25 + Review×0.20 + SLA×0.10
 *               + Activity×0.08 + Freshness×0.07) × 1000
 *
 * BoostComponent ≤ OrganicScore × 0.20 (HARD CAP)
 */
export function scoreListing(
    listing: RankingListingInput,
    guide: RankingGuideInput,
    boost: RankingBoostInput,
    conversion: ConversionMetrics | null,
    personalization: PersonalizationInput | null,
    intent: QueryIntentInput = { type: "BROWSE" },
): ScoringResult {
    // Compute each factor (all 0.0 – 1.0)
    const quality = computeQuality(guide, conversion);
    const trust = computeTrust(guide);
    const review = computeReviewQuality(guide, listing);
    const sla = computeSLA(guide);
    const activity = computeActivity(guide);
    const freshness = computeFreshness(listing, guide);

    // Apply query intent modifiers
    const mods = INTENT_MODIFIERS[intent.type] || INTENT_MODIFIERS.BROWSE;

    // Weighted organic score (0–1000 scale)
    const organicScore = Math.round(
        (quality * WEIGHTS.quality * mods.quality +
            trust * WEIGHTS.trust * mods.trust +
            review * WEIGHTS.reviewQuality +
            sla * WEIGHTS.sla +
            activity * WEIGHTS.activity +
            freshness * WEIGHTS.freshness * mods.freshness) * SCALE,
    );

    // Boost: percentage-capped, trust-gated
    const boostComponent = computeBoostComponent(organicScore, boost, guide.trustScore);

    // Personalization: ±100
    const personalizationAdjust = Math.round(
        computePersonalization(listing, personalization) * (mods.personalization ?? 1),
    );

    // Fill rate penalty
    const fillPenalty = computeFillPenalty(listing);

    // Final composite
    const finalScore = Math.max(0, organicScore + boostComponent + personalizationAdjust + fillPenalty);

    return {
        listingId: listing.id,
        finalScore,
        organicScore,
        boostComponent,
        qualityScore: Math.round(quality * WEIGHTS.quality * SCALE),
        trustScore: Math.round(trust * WEIGHTS.trust * SCALE),
        reviewQualityScore: Math.round(review * WEIGHTS.reviewQuality * SCALE),
        slaScore: Math.round(sla * WEIGHTS.sla * SCALE),
        activityScore: Math.round(activity * WEIGHTS.activity * SCALE),
        freshnessScore: Math.round(freshness * WEIGHTS.freshness * SCALE),
        personalizationAdjust,
        fillPenalty,
        breakdown: `Q:${Math.round(quality * 100)}|T:${Math.round(trust * 100)}|R:${Math.round(review * 100)}|S:${Math.round(sla * 100)}|A:${Math.round(activity * 100)}|F:${Math.round(freshness * 100)}→Org:${organicScore}+B:${boostComponent}+P:${personalizationAdjust}+FP:${fillPenalty}=${finalScore}`,
    };
}

// ─── EMA Smoothing ──────────────────────────────────────────────────────

/**
 * Apply Exponential Moving Average to prevent ranking oscillation.
 * α=0.3: 70% weight on previous, 30% on new → smooth convergence in ~5 cycles.
 */
export function smoothScore(rawScore: number, previousScore: number | null): number {
    if (previousScore === null) return rawScore;
    return Math.round(EMA_ALPHA * rawScore + (1 - EMA_ALPHA) * previousScore);
}

// ─── Batch Ranker ───────────────────────────────────────────────────────

export interface RankedListing extends ScoringResult {
    position: number;
}

/**
 * Score and sort a batch of listings.
 * Applies EMA smoothing if previous scores are provided.
 * Deterministic tiebreaker: newer listings first among equal scores.
 */
export function rankListings(
    results: ScoringResult[],
    previousScores?: Map<string, number>,
): RankedListing[] {
    // Apply EMA smoothing
    const smoothed = results.map(r => ({
        ...r,
        finalScore: smoothScore(r.finalScore, previousScores?.get(r.listingId) ?? null),
    }));

    // Sort descending by final score, tiebreaker: newer listing first
    smoothed.sort((a, b) => {
        if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
        // Deterministic tiebreaker: listingId (stable sort)
        return a.listingId.localeCompare(b.listingId);
    });

    // Assign positions
    return smoothed.map((r, idx) => ({ ...r, position: idx + 1 }));
}

// ─── Diversity Penalty ──────────────────────────────────────────────────

/**
 * Apply diversity penalty: if one agency dominates top results,
 * reduce their 3rd+ listing scores.
 *
 * Call AFTER rankListings, BEFORE returning to caller.
 */
export function applyDiversityPenalty(
    ranked: RankedListing[],
    getAgencyId: (listingId: string) => string,
): RankedListing[] {
    const agencyCounts = new Map<string, number>();

    return ranked.map(r => {
        const agencyId = getAgencyId(r.listingId);
        const count = (agencyCounts.get(agencyId) ?? 0) + 1;
        agencyCounts.set(agencyId, count);

        if (count === 3) {
            // 3rd listing: -10% score
            return { ...r, finalScore: Math.round(r.finalScore * 0.90) };
        } else if (count > 3) {
            // 4th+: -25% score
            return { ...r, finalScore: Math.round(r.finalScore * 0.75) };
        }

        return r;
    });
}

// ─── Query Intent Detector ──────────────────────────────────────────────

/**
 * Infer query intent from search parameters.
 * Used to adjust factor weights contextually.
 */
export function detectQueryIntent(params: {
    sortBy?: string;
    priceMin?: number;
    priceMax?: number;
    city?: string;
    date?: string;
    ratingMin?: number;
}): QueryIntentInput {
    if (params.sortBy === "price") return { type: "PRICE_SENSITIVE" };
    if (params.ratingMin && params.ratingMin >= 4) return { type: "QUALITY_SEEKING" };
    if (params.date) return { type: "DATE_SPECIFIC" };
    if (params.city) return { type: "LOCATION_SPECIFIC" };
    return { type: "BROWSE" };
}
