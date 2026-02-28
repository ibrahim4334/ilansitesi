// ─── Risk Tiers & Feature Matrix ────────────────────────────────────────
// Pure domain constants — defines enforcement tiers and feature gates.

export type RiskTier = "GREEN" | "YELLOW" | "ORANGE" | "RED" | "BLACK";

export const TIER_THRESHOLDS: Record<RiskTier, { min: number; max: number }> = {
    GREEN: { min: 0, max: 20 },
    YELLOW: { min: 21, max: 40 },
    ORANGE: { min: 41, max: 60 },
    RED: { min: 61, max: 80 },
    BLACK: { min: 81, max: 100 },
};

export function getTierFromScore(urs: number): RiskTier {
    if (urs <= 20) return "GREEN";
    if (urs <= 40) return "YELLOW";
    if (urs <= 60) return "ORANGE";
    if (urs <= 80) return "RED";
    return "BLACK";
}

// ─── Feature Access Matrix ──────────────────────────────────────────────

export interface FeatureGate {
    allowed: boolean;
    dailyLimit?: number;    // If allowed but capped
    requiresApproval?: boolean;
    reason?: string;
}

export type FeatureName =
    | "SEND_OFFER"
    | "UNLOCK_DEMAND"
    | "BOOST_LISTING"
    | "CREATE_LISTING"
    | "SUBMIT_REVIEW"
    | "SEND_MESSAGE"
    | "PURCHASE_TOKENS"
    | "REQUEST_REFUND"
    | "IDENTITY_APPLY";

const FULL_ACCESS: FeatureGate = { allowed: true };
const BLOCKED: FeatureGate = { allowed: false, reason: "Hesabınız kısıtlandı" };

const FEATURE_MATRIX: Record<RiskTier, Record<FeatureName, FeatureGate>> = {
    GREEN: {
        SEND_OFFER: FULL_ACCESS,
        UNLOCK_DEMAND: FULL_ACCESS,
        BOOST_LISTING: FULL_ACCESS,
        CREATE_LISTING: FULL_ACCESS,
        SUBMIT_REVIEW: FULL_ACCESS,
        SEND_MESSAGE: FULL_ACCESS,
        PURCHASE_TOKENS: FULL_ACCESS,
        REQUEST_REFUND: FULL_ACCESS,
        IDENTITY_APPLY: FULL_ACCESS,
    },
    YELLOW: {
        SEND_OFFER: { allowed: true, dailyLimit: 20 },
        UNLOCK_DEMAND: { allowed: true, dailyLimit: 15 },
        BOOST_LISTING: FULL_ACCESS,
        CREATE_LISTING: FULL_ACCESS,
        SUBMIT_REVIEW: FULL_ACCESS,
        SEND_MESSAGE: { allowed: true, dailyLimit: 100 },
        PURCHASE_TOKENS: FULL_ACCESS,
        REQUEST_REFUND: FULL_ACCESS,
        IDENTITY_APPLY: FULL_ACCESS,
    },
    ORANGE: {
        SEND_OFFER: { allowed: true, dailyLimit: 3 },
        UNLOCK_DEMAND: { allowed: true, dailyLimit: 2 },
        BOOST_LISTING: BLOCKED,
        CREATE_LISTING: { allowed: true, requiresApproval: true },
        SUBMIT_REVIEW: { allowed: true, requiresApproval: true },
        SEND_MESSAGE: { allowed: true, dailyLimit: 30 },
        PURCHASE_TOKENS: FULL_ACCESS,
        REQUEST_REFUND: { allowed: true, requiresApproval: true },
        IDENTITY_APPLY: FULL_ACCESS,
    },
    RED: {
        SEND_OFFER: BLOCKED,
        UNLOCK_DEMAND: BLOCKED,
        BOOST_LISTING: BLOCKED,
        CREATE_LISTING: BLOCKED,
        SUBMIT_REVIEW: BLOCKED,
        SEND_MESSAGE: { allowed: true, dailyLimit: 10 },
        PURCHASE_TOKENS: { allowed: true, dailyLimit: 1 },
        REQUEST_REFUND: { allowed: true, requiresApproval: true },
        IDENTITY_APPLY: FULL_ACCESS,
    },
    BLACK: {
        SEND_OFFER: BLOCKED,
        UNLOCK_DEMAND: BLOCKED,
        BOOST_LISTING: BLOCKED,
        CREATE_LISTING: BLOCKED,
        SUBMIT_REVIEW: BLOCKED,
        SEND_MESSAGE: BLOCKED,
        PURCHASE_TOKENS: BLOCKED,
        REQUEST_REFUND: BLOCKED,
        IDENTITY_APPLY: BLOCKED,
    },
};

/**
 * Check if a user can use a feature given their risk tier.
 */
export function getFeatureGate(tier: RiskTier, feature: FeatureName): FeatureGate {
    return FEATURE_MATRIX[tier]?.[feature] ?? BLOCKED;
}

// ─── URS Decay & Bonuses ────────────────────────────────────────────────

/** URS decays by this amount per week if no new signals fire */
export const URS_WEEKLY_DECAY = 5;

/** Identity-verified guides get this URS reduction */
export const IDENTITY_URS_BONUS = -15;

/** Guides with >10 trips and avg rating >4★ get this URS reduction */
export const TRUSTED_GUIDE_URS_BONUS = -10;

/** Admin false-positive whitelist duration (days) */
export const WHITELIST_DURATION_DAYS = 30;

// ─── Escalation Thresholds ──────────────────────────────────────────────

/** URS threshold for auto-creating a review ticket */
export const ESCALATION_THRESHOLD = 60;

/** URS threshold for auto-suspension */
export const AUTO_SUSPEND_THRESHOLD = 80;
