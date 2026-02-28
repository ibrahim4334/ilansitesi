// ─── Risk Signal Definitions ────────────────────────────────────────────
// Pure domain constants — no DB access, no side effects.
// Defines all 47 signals, their weights, and category allocations.

// ─── Signal Categories ──────────────────────────────────────────────────

export type SignalCategory = "BEHAVIOR" | "TRANSACTION" | "NETWORK" | "HISTORY";

export const CATEGORY_WEIGHTS: Record<SignalCategory, number> = {
    BEHAVIOR: 0.25,
    TRANSACTION: 0.30,
    NETWORK: 0.25,
    HISTORY: 0.20,
};

// ─── Individual Signal Definitions ──────────────────────────────────────

export interface SignalDefinition {
    id: string;
    category: SignalCategory;
    weight: number;         // Relative weight within category (sums to 100 per category)
    confidence: number;     // 0-1: how reliable this signal is alone
    description: string;
    threshold: number;      // Value at which signal fires
    maxScore: number;       // Maximum contribution to category score
}

// ─── Behavioral Signals ─────────────────────────────────────────────────

export const BEHAVIOR_SIGNALS: SignalDefinition[] = [
    {
        id: "SESSION_VELOCITY",
        category: "BEHAVIOR",
        weight: 15,
        confidence: 0.7,
        description: "Actions per minute exceeds normal human rate",
        threshold: 30,      // >30 actions/min
        maxScore: 15,
    },
    {
        id: "TIME_TO_ACTION",
        category: "BEHAVIOR",
        weight: 10,
        confidence: 0.6,
        description: "Time from login to first action is suspiciously fast",
        threshold: 2,        // <2 seconds
        maxScore: 10,
    },
    {
        id: "PAGE_SKIP",
        category: "BEHAVIOR",
        weight: 10,
        confidence: 0.5,
        description: "Skips listing details, goes straight to purchase",
        threshold: 0.7,      // >70% of actions skip detail pages
        maxScore: 10,
    },
    {
        id: "ODD_HOURS",
        category: "BEHAVIOR",
        weight: 5,
        confidence: 0.3,
        description: "Sustained activity between 02:00-06:00 Turkey time",
        threshold: 10,       // >10 actions in this window
        maxScore: 5,
    },
    {
        id: "DEVICE_CHANGES",
        category: "BEHAVIOR",
        weight: 10,
        confidence: 0.7,
        description: "Multiple device fingerprints in short window",
        threshold: 3,        // >3 devices in 24h
        maxScore: 10,
    },
    {
        id: "IP_MISMATCH",
        category: "BEHAVIOR",
        weight: 10,
        confidence: 0.5,
        description: "Action IP country differs from registration IP country",
        threshold: 1,        // binary: mismatch = 1
        maxScore: 10,
    },
    {
        id: "AUTOMATION_MARKERS",
        category: "BEHAVIOR",
        weight: 15,
        confidence: 0.9,
        description: "Browser automation detected (webdriver, headless UA)",
        threshold: 1,        // binary: detected = 1
        maxScore: 15,
    },
    {
        id: "FORM_FILL_SPEED",
        category: "BEHAVIOR",
        weight: 5,
        confidence: 0.5,
        description: "Complex forms filled in <500ms",
        threshold: 500,      // <500ms
        maxScore: 5,
    },
    {
        id: "REVIEW_WRITE_SPEED",
        category: "BEHAVIOR",
        weight: 10,
        confidence: 0.6,
        description: "Long review written in <10 seconds (copy-paste)",
        threshold: 10,       // <10s for >100 chars
        maxScore: 10,
    },
    {
        id: "LOW_INTERACTION_DEPTH",
        category: "BEHAVIOR",
        weight: 10,
        confidence: 0.4,
        description: "Viewed listing <3 seconds before action",
        threshold: 3,        // <3 seconds on page
        maxScore: 10,
    },
];

// ─── Transaction Signals ────────────────────────────────────────────────

export const TRANSACTION_SIGNALS: SignalDefinition[] = [
    {
        id: "SPEND_VELOCITY",
        category: "TRANSACTION",
        weight: 20,
        confidence: 0.8,
        description: "Token spend rate exceeds 3σ from rolling mean",
        threshold: 3,        // >3 standard deviations
        maxScore: 20,
    },
    {
        id: "REFUND_RATE",
        category: "TRANSACTION",
        weight: 15,
        confidence: 0.7,
        description: "Excessive refund requests in rolling window",
        threshold: 2,        // >2 refunds in 30 days
        maxScore: 15,
    },
    {
        id: "PURCHASE_SPEND_GAP",
        category: "TRANSACTION",
        weight: 15,
        confidence: 0.6,
        description: "Tokens spent within 60s of purchase",
        threshold: 60,       // <60 seconds
        maxScore: 15,
    },
    {
        id: "FAILED_SPEND_PROBING",
        category: "TRANSACTION",
        weight: 10,
        confidence: 0.8,
        description: "Repeated INSUFFICIENT_TOKENS errors (balance probing)",
        threshold: 5,        // >5 in 1 hour
        maxScore: 10,
    },
    {
        id: "BOOST_SPAM",
        category: "TRANSACTION",
        weight: 15,
        confidence: 0.7,
        description: "Hitting daily boost cap on multiple listings",
        threshold: 2,        // Maxed on >2 listings in same day
        maxScore: 15,
    },
    {
        id: "OFFER_SCATTER",
        category: "TRANSACTION",
        weight: 10,
        confidence: 0.5,
        description: "Offers sent to too many unique recipients",
        threshold: 20,       // >20 unique recipients in 24h
        maxScore: 10,
    },
    {
        id: "IDEMPOTENCY_ANOMALY",
        category: "TRANSACTION",
        weight: 15,
        confidence: 0.9,
        description: "Sequential or predictable idempotency keys (scripted)",
        threshold: 5,        // >5 sequential keys detected
        maxScore: 15,
    },
];

// ─── Network/Identity Signals ───────────────────────────────────────────

export const NETWORK_SIGNALS: SignalDefinition[] = [
    {
        id: "SHARED_IP",
        category: "NETWORK",
        weight: 25,
        confidence: 0.6,
        description: "IP address shared with multiple accounts",
        threshold: 3,        // >3 accounts same IP in 7 days
        maxScore: 25,
    },
    {
        id: "SHARED_DEVICE",
        category: "NETWORK",
        weight: 25,
        confidence: 0.8,
        description: "Device fingerprint shared across accounts",
        threshold: 2,        // >2 accounts same fingerprint
        maxScore: 25,
    },
    {
        id: "PHONE_RECYCLING",
        category: "NETWORK",
        weight: 15,
        confidence: 0.7,
        description: "Phone linked to previously suspended account",
        threshold: 1,        // binary
        maxScore: 15,
    },
    {
        id: "DISPOSABLE_EMAIL",
        category: "NETWORK",
        weight: 10,
        confidence: 0.9,
        description: "Email from known disposable domain",
        threshold: 1,        // binary
        maxScore: 10,
    },
    {
        id: "REGISTRATION_BURST",
        category: "NETWORK",
        weight: 15,
        confidence: 0.7,
        description: "Multiple accounts from same IP in short window",
        threshold: 2,        // >2 accounts from same IP in 1h
        maxScore: 15,
    },
    {
        id: "REFERRAL_CHAIN",
        category: "NETWORK",
        weight: 10,
        confidence: 0.5,
        description: "Deep referral chain from same IP",
        threshold: 3,        // chain depth >3 from same IP
        maxScore: 10,
    },
];

// ─── History Signals ────────────────────────────────────────────────────

export const HISTORY_SIGNALS: SignalDefinition[] = [
    {
        id: "PAST_ENFORCEMENT",
        category: "HISTORY",
        weight: 30,
        confidence: 0.9,
        description: "Previous RESTRICT or SUSPEND actions",
        threshold: 1,        // binary
        maxScore: 30,
    },
    {
        id: "REVIEW_REMOVAL_RATE",
        category: "HISTORY",
        weight: 15,
        confidence: 0.6,
        description: ">30% of submitted reviews removed by admin",
        threshold: 0.3,      // >30%
        maxScore: 15,
    },
    {
        id: "LISTING_REJECTION_RATE",
        category: "HISTORY",
        weight: 15,
        confidence: 0.6,
        description: ">50% of submitted listings rejected",
        threshold: 0.5,      // >50%
        maxScore: 15,
    },
    {
        id: "REPORT_COUNT",
        category: "HISTORY",
        weight: 20,
        confidence: 0.5,
        description: "Multiple user reports from distinct reporters",
        threshold: 3,        // >3 distinct reporters
        maxScore: 20,
    },
    {
        id: "NEW_ACCOUNT_HIGH_ACTIVITY",
        category: "HISTORY",
        weight: 10,
        confidence: 0.4,
        description: "Account <7 days old with high action count",
        threshold: 50,       // >50 actions in first week
        maxScore: 10,
    },
    {
        id: "TRUST_DECLINE",
        category: "HISTORY",
        weight: 10,
        confidence: 0.5,
        description: "Trust score declining over 30-day window",
        threshold: 0.15,     // >15% decline
        maxScore: 10,
    },
];

// ─── All Signals Flattened ──────────────────────────────────────────────

export const ALL_SIGNALS: SignalDefinition[] = [
    ...BEHAVIOR_SIGNALS,
    ...TRANSACTION_SIGNALS,
    ...NETWORK_SIGNALS,
    ...HISTORY_SIGNALS,
];

// ─── Disposable Email Domains ───────────────────────────────────────────

export const DISPOSABLE_EMAIL_DOMAINS = new Set([
    "tempmail.com", "guerrillamail.com", "mailnesia.com", "throwaway.email",
    "yopmail.com", "getnada.com", "maildrop.cc", "dispostable.com",
    "mailinator.com", "sharklasers.com", "guerrillamailblock.com",
    "temp-mail.org", "fakeinbox.com", "trashmail.com", "10minutemail.com",
]);
