// ─── Ranking Service (v3) ───────────────────────────────────────────────
// Wires the 6-factor ranking engine with Prisma data layer.
// Uses percentage-capped boost and trust-gated tiers.

import { prisma } from "@/lib/prisma";
import {
  scoreListing,
  rankListings,
  applyDiversityPenalty,
  detectQueryIntent,
  type RankingListingInput,
  type RankingGuideInput,
  type RankingBoostInput,
  type PersonalizationInput,
  type RankedListing,
} from "@/src/modules/ranking/ranking-engine";
import { getBatchConversionMetrics } from "@/src/modules/ranking/conversion-tracker";
import { calculateProfileCompleteness } from "@/lib/listing-ranking";

export class RankingService {
  /**
   * Get ranked listings using the 5-pillar scoring engine.
   * Fixes SQL injection from legacy implementation.
   *
   * @param options Search parameters
   * @returns Ranked listings with score breakdowns
   */
  static async getRankedListings(options: {
    city?: string;
    priceMin?: number;
    priceMax?: number;
    date?: string;
    ratingMin?: number;
    sortBy?: string;
    limit?: number;
    offset?: number;
    userId?: string; // For personalization
  }): Promise<{ listings: RankedListing[]; total: number }> {
    const { city, limit = 20, offset = 0, userId } = options;

    // ── 1. Fetch approved, active listings ──────────────────────
    const where: any = {
      approvalStatus: "APPROVED",
      active: true,
    };
    if (city) where.city = city;

    const [rawListings, total] = await Promise.all([
      prisma.guideListing.findMany({
        where,
        include: {
          guide: {
            select: {
              id: true,
              userId: true,
              trustScore: true,
              isIdentityVerified: true,
              completedTrips: true,
              packageType: true,
              avgResponseHours: true,
              fullName: true,
              phone: true,
              bio: true,
              photo: true,
              city: true,
              riskScore: { select: { tier: true } },
              reviewsReceived: {
                where: { status: "APPROVED" },
                select: { overallRating: true },
              },
            },
          },
          boosts: {
            where: { expiresAt: { gt: new Date() } },
            select: { effectivePower: true, boostType: true },
          },
        },
        // Fetch more than needed — we'll sort in app after scoring
        take: Math.min(limit + offset + 50, 200),
      }),
      prisma.guideListing.count({ where }),
    ]);

    if (rawListings.length === 0) {
      return { listings: [], total: 0 };
    }

    // ── 2. Batch load conversion metrics ────────────────────────
    const listingIds = rawListings.map((l: any) => l.id);
    const conversionMap = await getBatchConversionMetrics(listingIds);

    // ── 3. Load personalization data (if authenticated) ─────────
    let personalization: PersonalizationInput | null = null;
    if (userId) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      const [clickedListings, ignoredIds] = await Promise.all([
        prisma.listingClick.findMany({
          where: { userId, createdAt: { gte: thirtyDaysAgo } },
          select: { listingId: true },
          distinct: ["listingId"],
        }),
        // Listings shown 3+ times but never clicked
        prisma.$queryRaw<{ listingId: string }[]>`
                    SELECT i.listingId
                    FROM listing_impressions i
                    WHERE i.userId = ${userId}
                      AND i.createdAt > ${thirtyDaysAgo}
                    GROUP BY i.listingId
                    HAVING COUNT(*) >= 3
                      AND i.listingId NOT IN (
                          SELECT DISTINCT c.listingId FROM listing_clicks c 
                          WHERE c.userId = ${userId}
                      )
                `,
      ]);

      personalization = {
        userId,
        preferredPriceMin: options.priceMin,
        preferredPriceMax: options.priceMax,
        searchedCities: city ? [city] : [],
        clickedListingIds: clickedListings.map(c => c.listingId),
        ignoredListingIds: ignoredIds.map(i => i.listingId),
      };
    }

    // ── 4. Detect query intent ──────────────────────────────────
    const intent = detectQueryIntent({
      sortBy: options.sortBy,
      priceMin: options.priceMin,
      priceMax: options.priceMax,
      city: options.city,
      date: options.date,
      ratingMin: options.ratingMin,
    });

    // ── 5. Score each listing ───────────────────────────────────
    const scoringResults = rawListings.map((l: any) => {
      const guide = l.guide;

      // Build listing input
      const listingInput: RankingListingInput = {
        id: l.id,
        type: "GUIDE_PROFILE",
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
        filled: l.currentCount || 0,
        quota: l.quotaTarget || 0,
        price: l.price || 0,
        city: l.city || "",
      };

      // Build guide input
      const reviews = guide.reviewsReceived || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + Number(r.overallRating), 0) / reviews.length
        : 0;

      const guideInput: RankingGuideInput = {
        userId: guide.id,
        packageType: guide.packageType || "FREE",
        isIdentityVerified: (guide as any).isIdentityVerified || false,
        trustScore: guide.trustScore || 50,
        completedTrips: guide.completedTrips || 0,
        profileCompleteness: calculateProfileCompleteness({
          fullName: guide.fullName,
          phone: guide.phone,
          bio: guide.bio,
          photo: guide.photo,
          city: guide.city,
          isIdentityVerified: (guide as any).isIdentityVerified,
        }),
        avgResponseHours: guide.avgResponseHours || 24,
        recentActivityCount: 10, // TODO: compute from velocity counters
        riskTier: guide.riskScore?.tier || "GREEN",
        avgReviewRating: avgRating,
        reviewCount: reviews.length,
        concentrationPenalty: 0, // Set by daily batch job (batchConcentrationAnalysis)
        accountAgeDays: 365,
        totalListingsCreated: 1,
      };

      // Build boost input
      const activeBoosts = l.boosts || [];
      const topBoost = activeBoosts.length > 0
        ? activeBoosts.reduce((best: any, b: any) => b.effectivePower > best.effectivePower ? b : best)
        : null;

      const boostInput: RankingBoostInput = {
        isActive: activeBoosts.length > 0,
        effectivePower: topBoost?.effectivePower ?? 0,
        activeBoostCount: activeBoosts.length,
        boostTier: topBoost?.boostType as "BASIC" | "PREMIUM" | "ELITE" | undefined,
      };

      // Get conversion data
      const conversion = conversionMap.get(l.id) || null;

      return scoreListing(listingInput, guideInput, boostInput, conversion, personalization, intent);
    });

    // ── 6. Rank with EMA smoothing ──────────────────────────────
    const ranked = rankListings(scoringResults);

    // ── 7. Apply diversity penalty ─────────────────────────────
    const guideMap = new Map(rawListings.map((l: any) => [l.id, l.guide?.id ?? ""]));
    const diversified = applyDiversityPenalty(ranked, id => guideMap.get(id) ?? "");

    // Re-sort after diversity penalty
    diversified.sort((a, b) => b.finalScore - a.finalScore);
    diversified.forEach((r, idx) => { r.position = idx + 1; });

    // ── 8. Paginate ─────────────────────────────────────────────
    const paginated = diversified.slice(offset, offset + limit);

    // ── 8. Enrich with listing data for response ────────────────
    const enrichedMap = new Map(
      rawListings.map((l: any) => [l.id, l])
    );

    const enriched = paginated.map(r => ({
      ...r,
      listing: enrichedMap.get(r.listingId) || null,
    })) as RankedListing[];

    return { listings: enriched, total };
  }
}
