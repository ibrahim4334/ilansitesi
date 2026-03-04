// ─── Role Capability Configuration ──────────────────────────────────────
// Centralized role limits. Package-level overrides in package-system.ts.

export interface RoleCapabilities {
    label: string;
    canCreateListing: boolean;
    canSendOffer: boolean;
    canUnlockDemand: boolean;
    canBoostListing: boolean;
    canSpotlight: boolean;
    canRepublish: boolean;
    canRefresh: boolean;
    canPurchaseTokens: boolean;
    maxActiveListings: number;     // Hard cap (package may be lower)
    maxDailyOffers: number;
    badge: string | null;
    onboardingTokens: number;
    interestCost: number;
    maxDailyInterests: number;
}

export const ROLE_CONFIG: Record<string, RoleCapabilities> = {
    FREEMIUM: {
        label: "Ücretsiz",
        canCreateListing: true,
        canSendOffer: true,
        canUnlockDemand: false,
        canBoostListing: false,
        canSpotlight: false,
        canRepublish: false,
        canRefresh: false,
        canPurchaseTokens: false,
        maxActiveListings: 1,
        maxDailyOffers: 1,
        badge: null,
        onboardingTokens: 20,
        interestCost: 5,
        maxDailyInterests: 1,
    },
    GUIDE: {
        label: "Rehber",
        canCreateListing: true,
        canSendOffer: true,
        canUnlockDemand: true,
        canBoostListing: true,
        canSpotlight: false,
        canRepublish: true,
        canRefresh: true,
        canPurchaseTokens: true,
        maxActiveListings: 5,
        maxDailyOffers: 50,
        badge: "guide",
        onboardingTokens: 20,
        interestCost: 5,
        maxDailyInterests: 20,
    },
    CORPORATE: {
        label: "Kurumsal",
        canCreateListing: true,
        canSendOffer: true,
        canUnlockDemand: true,
        canBoostListing: true,
        canSpotlight: true,
        canRepublish: true,
        canRefresh: true,
        canPurchaseTokens: true,
        maxActiveListings: 100,
        maxDailyOffers: 200,
        badge: "corporate",
        onboardingTokens: 20,
        interestCost: 3,
        maxDailyInterests: 100,
    },
    ADMIN: {
        label: "Admin",
        canCreateListing: true,
        canSendOffer: true,
        canUnlockDemand: true,
        canBoostListing: true,
        canSpotlight: true,
        canRepublish: true,
        canRefresh: true,
        canPurchaseTokens: false,
        maxActiveListings: 999,
        maxDailyOffers: 999,
        badge: "admin",
        onboardingTokens: 0,
        interestCost: 0,
        maxDailyInterests: 999,
    },
    BANNED: {
        label: "Yasaklı",
        canCreateListing: false,
        canSendOffer: false,
        canUnlockDemand: false,
        canBoostListing: false,
        canSpotlight: false,
        canRepublish: false,
        canRefresh: false,
        canPurchaseTokens: false,
        maxActiveListings: 0,
        maxDailyOffers: 0,
        badge: null,
        onboardingTokens: 0,
        interestCost: 9999,
        maxDailyInterests: 0,
    },
} as const;

/** Get config for a role, defaulting to FREEMIUM if unknown */
export function getRoleConfig(role: string | undefined | null): RoleCapabilities {
    return ROLE_CONFIG[role || "FREEMIUM"] || ROLE_CONFIG.FREEMIUM;
}
