// ─── Package Limits & Token Economy ─────────────────────────────────────
// Source of truth for all package capabilities and token pricing.

import type { PackageType } from "./db-types";

// ── Token Costs ─────────────────────────────────────────────────────────

export const TOKEN_COSTS = {
    OFFER_SEND: 5,
    DEMAND_UNLOCK: 3,
    BOOST: 15,
    SPOTLIGHT: 25,
    REPUBLISH: 2,
    REFRESH: 1,
} as const;

// ── Daily Hard Caps (per package) ───────────────────────────────────────

export interface DailyCaps {
    offers: number;
    unlocks: number;
    boosts: number;
    spotlights: number;
}

export const DAILY_CAPS: Record<PackageType, DailyCaps> = {
    FREE: { offers: 1, unlocks: 0, boosts: 0, spotlights: 0 },
    STARTER: { offers: 10, unlocks: 5, boosts: 1, spotlights: 0 },
    PRO: { offers: 30, unlocks: 15, boosts: 3, spotlights: 0 },
    LEGEND: { offers: 50, unlocks: 30, boosts: 5, spotlights: 0 },
    CORP_BASIC: { offers: 20, unlocks: 10, boosts: 3, spotlights: 1 },
    CORP_PRO: { offers: 50, unlocks: 30, boosts: 10, spotlights: 3 },
    CORP_ENTERPRISE: { offers: 200, unlocks: 100, boosts: 30, spotlights: 10 },
};

// ── Package Limits ──────────────────────────────────────────────────────

export interface PackageLimits {
    maxListings: number;
    listingDays: number;
    initialTokens: number;       // One-time signup grant
    monthlyTokens: number;       // Per subscription renewal
    softCap: number;             // Max accumulation for subscription tokens
    maxDailyOffers: number;
    maxBoosts: number;
    boostDays: number;
    phoneVisible: boolean;
    featuredEligible: boolean;
    priorityRanking: boolean;
    trustBoost: boolean;
    diyanetEligible: boolean;
    spotlightEligible: boolean;
    posterQuality: "LOW" | "NORMAL" | "HIGH";
    watermark: boolean;
    aiGenerator: boolean;
}

export const PACKAGE_LIMITS: Record<PackageType, PackageLimits> = {
    // ── Rehber Paketleri ─────────────────────────────────────────
    FREE: {
        maxListings: 1,
        listingDays: 30,
        initialTokens: 20,
        monthlyTokens: 0,
        softCap: 20,              // No accumulation
        maxDailyOffers: 1,
        maxBoosts: 0,
        boostDays: 0,
        phoneVisible: false,
        featuredEligible: false,
        priorityRanking: false,
        trustBoost: false,
        diyanetEligible: false,
        spotlightEligible: false,
        posterQuality: "LOW",
        watermark: true,
        aiGenerator: false,
    },
    STARTER: {
        maxListings: 3,
        listingDays: 60,
        initialTokens: 20,
        monthlyTokens: 25,
        softCap: 50,              // 2× monthly
        maxDailyOffers: 10,
        maxBoosts: 1,
        boostDays: 3,
        phoneVisible: false,
        featuredEligible: false,
        priorityRanking: false,
        trustBoost: false,
        diyanetEligible: true,
        spotlightEligible: false,
        posterQuality: "NORMAL",
        watermark: false,
        aiGenerator: false,
    },
    PRO: {
        maxListings: 5,
        listingDays: 90,
        initialTokens: 50,
        monthlyTokens: 60,
        softCap: 120,
        maxDailyOffers: 30,
        maxBoosts: 3,
        boostDays: 5,
        phoneVisible: true,
        featuredEligible: true,
        priorityRanking: true,
        trustBoost: false,
        diyanetEligible: true,
        spotlightEligible: false,
        posterQuality: "HIGH",
        watermark: false,
        aiGenerator: false,
    },
    LEGEND: {
        maxListings: 5,
        listingDays: 365,
        initialTokens: 100,
        monthlyTokens: 200,
        softCap: 400,
        maxDailyOffers: 50,
        maxBoosts: 5,
        boostDays: 7,
        phoneVisible: true,
        featuredEligible: true,
        priorityRanking: true,
        trustBoost: true,
        diyanetEligible: true,
        spotlightEligible: false,
        posterQuality: "HIGH",
        watermark: false,
        aiGenerator: true,
    },
    // ── Kurumsal Paketleri ───────────────────────────────────────
    CORP_BASIC: {
        maxListings: 10,
        listingDays: 90,
        initialTokens: 50,
        monthlyTokens: 50,
        softCap: 100,
        maxDailyOffers: 20,
        maxBoosts: 3,
        boostDays: 5,
        phoneVisible: true,
        featuredEligible: true,
        priorityRanking: true,
        trustBoost: false,
        diyanetEligible: true,
        spotlightEligible: true,
        posterQuality: "NORMAL",
        watermark: false,
        aiGenerator: false,
    },
    CORP_PRO: {
        maxListings: 30,
        listingDays: 180,
        initialTokens: 100,
        monthlyTokens: 150,
        softCap: 300,
        maxDailyOffers: 50,
        maxBoosts: 10,
        boostDays: 7,
        phoneVisible: true,
        featuredEligible: true,
        priorityRanking: true,
        trustBoost: true,
        diyanetEligible: true,
        spotlightEligible: true,
        posterQuality: "HIGH",
        watermark: false,
        aiGenerator: false,
    },
    CORP_ENTERPRISE: {
        maxListings: 100,
        listingDays: 365,
        initialTokens: 200,
        monthlyTokens: 500,
        softCap: 1000,
        maxDailyOffers: 200,
        maxBoosts: 30,
        boostDays: 14,
        phoneVisible: true,
        featuredEligible: true,
        priorityRanking: true,
        trustBoost: true,
        diyanetEligible: true,
        spotlightEligible: true,
        posterQuality: "HIGH",
        watermark: false,
        aiGenerator: true,
    },
};

// ── Token Pricing (Ek Satın Alma) ───────────────────────────────────────

export const TOKEN_PACKAGES = [
    { id: "small", tokens: 10, priceTRY: 49, unitPrice: 4.90 },
    { id: "medium", tokens: 30, priceTRY: 119, unitPrice: 3.97 },
    { id: "large", tokens: 75, priceTRY: 249, unitPrice: 3.32 },
    { id: "mega", tokens: 200, priceTRY: 549, unitPrice: 2.75 },
    { id: "enterprise", tokens: 500, priceTRY: 999, unitPrice: 2.00 },
] as const;

/**
 * Logarithmic unit price degression.
 * unitPrice(n) = max(MIN_PRICE, BASE × (1 - log₁₀(n/10) × FACTOR))
 */
export function calculateTokenPrice(quantity: number): number {
    const BASE_PRICE = 4.90;
    const DISCOUNT_FACTOR = 0.25;
    const MIN_PRICE = 1.50;

    const unitPrice = Math.max(
        MIN_PRICE,
        BASE_PRICE * (1 - Math.log10(Math.max(quantity, 10) / 10) * DISCOUNT_FACTOR)
    );
    return Math.round(unitPrice * quantity);
}

// ── Helpers ─────────────────────────────────────────────────────────────

export class PackageSystem {
    static getLimits(pkg: string): PackageLimits {
        return PACKAGE_LIMITS[pkg as PackageType] || PACKAGE_LIMITS.FREE;
    }

    static getDailyCaps(pkg: string): DailyCaps {
        return DAILY_CAPS[pkg as PackageType] || DAILY_CAPS.FREE;
    }

    static canCreateListing(packageType: string, currentCount: number): boolean {
        return currentCount < this.getLimits(packageType).maxListings;
    }

    static getListingDuration(packageType: string): number {
        return this.getLimits(packageType).listingDays;
    }

    static isPhoneVisible(packageType: string): boolean {
        return this.getLimits(packageType).phoneVisible;
    }

    static isDiyanetEligible(packageType: string): boolean {
        return this.getLimits(packageType).diyanetEligible;
    }

    static canBoost(packageType: string, currentBoostCount: number): boolean {
        const limits = this.getLimits(packageType);
        return limits.maxBoosts > 0 && currentBoostCount < limits.maxBoosts;
    }

    static canSpotlight(packageType: string): boolean {
        return this.getLimits(packageType).spotlightEligible;
    }

    /**
     * Calculate new balance after monthly subscription renewal.
     * Applies soft cap to subscription tokens only.
     */
    static calculateRenewalBalance(currentBalance: number, packageType: string): number {
        const limits = this.getLimits(packageType);
        return Math.min(currentBalance + limits.monthlyTokens, limits.softCap);
    }

    static getPosterQuality(packageType: string): "LOW" | "NORMAL" | "HIGH" {
        return this.getLimits(packageType).posterQuality;
    }
}
