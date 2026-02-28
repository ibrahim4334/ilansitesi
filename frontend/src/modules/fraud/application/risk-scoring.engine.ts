// ─── Risk Scoring Engine ────────────────────────────────────────────────
// Computes User Risk Score (URS) from signal values.
// ASYNC-only — runs in background worker, never on hot path.
// Reads from multiple tables, writes to risk_scores.

import { prisma } from "@/lib/prisma";
import {
    CATEGORY_WEIGHTS,
    BEHAVIOR_SIGNALS,
    TRANSACTION_SIGNALS,
    NETWORK_SIGNALS,
    HISTORY_SIGNALS,
    DISPOSABLE_EMAIL_DOMAINS,
    type SignalDefinition,
} from "../domain/risk-signals";
import {
    getTierFromScore,
    DIYANET_URS_BONUS,
    TRUSTED_GUIDE_URS_BONUS,
    ESCALATION_THRESHOLD,
    AUTO_SUSPEND_THRESHOLD,
    type RiskTier,
} from "../domain/risk-tiers";

// ─── Signal Value Types ─────────────────────────────────────────────────

interface SignalSnapshot {
    [signalId: string]: {
        value: number;
        fired: boolean;
        contribution: number;
    };
}

interface ScoringResult {
    urs: number;
    tier: RiskTier;
    behaviorScore: number;
    transactionScore: number;
    networkScore: number;
    historyScore: number;
    signals: SignalSnapshot;
    previousTier: RiskTier | null;
    tierChanged: boolean;
}

// ─── Core Scoring Function ──────────────────────────────────────────────

/**
 * Compute URS for a given user. This is the main entry point.
 * Should be called from a background worker when signals are collected.
 */
export async function computeUserRiskScore(userId: string): Promise<ScoringResult> {
    const signals: SignalSnapshot = {};

    // Load user context
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            reviewsReceived: { where: { status: "APPROVED" }, select: { overallRating: true } },
            reviewsGiven: { select: { id: true, status: true, deletedAt: true } },
            riskScore: true,
        },
    });

    if (!user) throw new Error(`User ${userId} not found`);

    // Check whitelist — skip scoring if whitelisted
    if (user.riskScore?.whitelistedUntil && user.riskScore.whitelistedUntil > new Date()) {
        return {
            urs: user.riskScore.urs,
            tier: user.riskScore.tier as RiskTier,
            behaviorScore: user.riskScore.behaviorScore,
            transactionScore: user.riskScore.transactionScore,
            networkScore: user.riskScore.networkScore,
            historyScore: user.riskScore.historyScore,
            signals: (user.riskScore.signals as SignalSnapshot) || {},
            previousTier: user.riskScore.tier as RiskTier,
            tierChanged: false,
        };
    }

    // ── Compute each category ───────────────────────────────────────

    const behaviorScore = await computeBehaviorScore(userId, signals);
    const transactionScore = await computeTransactionScore(userId, signals);
    const networkScore = await computeNetworkScore(userId, user.email, signals);
    const historyScore = await computeHistoryScore(userId, user, signals);

    // ── Weighted composite ──────────────────────────────────────────

    let urs =
        CATEGORY_WEIGHTS.BEHAVIOR * behaviorScore +
        CATEGORY_WEIGHTS.TRANSACTION * transactionScore +
        CATEGORY_WEIGHTS.NETWORK * networkScore +
        CATEGORY_WEIGHTS.HISTORY * historyScore;

    // ── Apply bonuses (negative = reduces risk) ─────────────────────

    if (user.isDiyanetVerified) {
        urs += DIYANET_URS_BONUS;
    }

    const avgRating = user.reviewsReceived.length > 0
        ? user.reviewsReceived.reduce((sum, r) => sum + Number(r.overallRating), 0) / user.reviewsReceived.length
        : 0;

    if (user.completedTrips > 10 && avgRating > 4) {
        urs += TRUSTED_GUIDE_URS_BONUS;
    }

    // Clamp to [0, 100]
    urs = Math.max(0, Math.min(100, Math.round(urs)));

    const tier = getTierFromScore(urs);
    const previousTier = (user.riskScore?.tier as RiskTier) || null;
    const tierChanged = previousTier !== null && previousTier !== tier;

    // ── Persist ─────────────────────────────────────────────────────

    await prisma.riskScore.upsert({
        where: { userId },
        create: {
            userId,
            urs,
            tier,
            behaviorScore,
            transactionScore,
            networkScore,
            historyScore,
            signals: signals as any,
        },
        update: {
            urs,
            tier,
            behaviorScore,
            transactionScore,
            networkScore,
            historyScore,
            signals: signals as any,
        },
    });

    // ── Log tier change as risk event ───────────────────────────────

    if (tierChanged) {
        await prisma.riskEvent.create({
            data: {
                userId,
                eventType: "TIER_CHANGE",
                severity: urs >= AUTO_SUSPEND_THRESHOLD ? "CRITICAL" : urs >= ESCALATION_THRESHOLD ? "HIGH" : "MEDIUM",
                metadata: { previousTier, newTier: tier, urs },
            },
        });
    }

    return { urs, tier, behaviorScore, transactionScore, networkScore, historyScore, signals, previousTier, tierChanged };
}

// ─── Category Scorers ───────────────────────────────────────────────────

function evaluateSignal(
    signal: SignalDefinition,
    actualValue: number,
    snapshot: SignalSnapshot,
): number {
    const fired = signal.threshold <= 1
        ? actualValue >= signal.threshold  // Binary signals
        : actualValue >= signal.threshold; // Threshold signals

    const contribution = fired ? signal.maxScore * signal.confidence : 0;

    snapshot[signal.id] = {
        value: actualValue,
        fired,
        contribution,
    };

    return contribution;
}

async function computeBehaviorScore(userId: string, snapshot: SignalSnapshot): Promise<number> {
    // Behavior signals require client-side telemetry.
    // For now, evaluate what we can from server-side data.

    let score = 0;

    // DEVICE_CHANGES: count distinct fingerprints in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const deviceCount = await prisma.deviceFingerprint.groupBy({
        by: ["fingerprint"],
        where: { userId, createdAt: { gte: oneDayAgo } },
    });
    score += evaluateSignal(BEHAVIOR_SIGNALS[4], deviceCount.length, snapshot); // DEVICE_CHANGES

    // IP_MISMATCH: check if latest IP country differs from registration IP
    // (Requires IP-to-country lookup — stub for now)
    snapshot["IP_MISMATCH"] = { value: 0, fired: false, contribution: 0 };

    // AUTOMATION_MARKERS: check for webdriver in recent UA
    const recentDevice = await prisma.deviceFingerprint.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
    const hasAutomation = recentDevice?.userAgent?.includes("HeadlessChrome") ||
        recentDevice?.userAgent?.includes("webdriver") ? 1 : 0;
    score += evaluateSignal(BEHAVIOR_SIGNALS[6], hasAutomation, snapshot); // AUTOMATION_MARKERS

    // Other behavior signals require client telemetry — initialize as 0
    for (const sig of BEHAVIOR_SIGNALS) {
        if (!snapshot[sig.id]) {
            snapshot[sig.id] = { value: 0, fired: false, contribution: 0 };
        }
    }

    return Math.min(score, 100);
}

async function computeTransactionScore(userId: string, snapshot: SignalSnapshot): Promise<number> {
    let score = 0;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    // REFUND_RATE: count refund entries in last 30 days
    const refundCount = await prisma.tokenTransaction.count({
        where: { userId, entryType: "REFUND", createdAt: { gte: thirtyDaysAgo } },
    });
    score += evaluateSignal(TRANSACTION_SIGNALS[1], refundCount, snapshot); // REFUND_RATE

    // FAILED_SPEND_PROBING: approximate via recent CONSUME entries that failed
    // We don't track failed spends in the ledger, so this relies on risk events
    const failedSpendEvents = await prisma.riskEvent.count({
        where: { userId, eventType: "INSUFFICIENT_TOKENS", createdAt: { gte: oneHourAgo } },
    });
    score += evaluateSignal(TRANSACTION_SIGNALS[3], failedSpendEvents, snapshot); // FAILED_SPEND_PROBING

    // OFFER_SCATTER: count distinct relatedIds for CONSUME entries today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const offerEntries = await prisma.tokenTransaction.findMany({
        where: {
            userId,
            entryType: "CONSUME",
            reasonCode: { contains: "OFFER_SEND" },
            createdAt: { gte: startOfDay },
        },
        select: { referenceId: true },
    });
    const uniqueOfferTargets = new Set(offerEntries.map(e => e.referenceId).filter(Boolean));
    score += evaluateSignal(TRANSACTION_SIGNALS[5], uniqueOfferTargets.size, snapshot); // OFFER_SCATTER

    // Initialize remaining transaction signals
    for (const sig of TRANSACTION_SIGNALS) {
        if (!snapshot[sig.id]) {
            snapshot[sig.id] = { value: 0, fired: false, contribution: 0 };
        }
    }

    return Math.min(score, 100);
}

async function computeNetworkScore(userId: string, email: string | null, snapshot: SignalSnapshot): Promise<number> {
    let score = 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    // SHARED_IP: count distinct userIds sharing IPs with this user
    const userIPs = await prisma.deviceFingerprint.findMany({
        where: { userId },
        select: { ipAddress: true },
        distinct: ["ipAddress"],
    });
    if (userIPs.length > 0) {
        const ipList = userIPs.map(d => d.ipAddress);
        const sharedIPAccounts = await prisma.deviceFingerprint.groupBy({
            by: ["userId"],
            where: {
                ipAddress: { in: ipList },
                userId: { not: userId },
                createdAt: { gte: sevenDaysAgo },
            },
        });
        score += evaluateSignal(NETWORK_SIGNALS[0], sharedIPAccounts.length, snapshot); // SHARED_IP
    }

    // SHARED_DEVICE: count distinct userIds sharing fingerprints
    const userFingerprints = await prisma.deviceFingerprint.findMany({
        where: { userId },
        select: { fingerprint: true },
        distinct: ["fingerprint"],
    });
    if (userFingerprints.length > 0) {
        const fpList = userFingerprints.map(d => d.fingerprint);
        const sharedDeviceAccounts = await prisma.deviceFingerprint.groupBy({
            by: ["userId"],
            where: {
                fingerprint: { in: fpList },
                userId: { not: userId },
            },
        });
        score += evaluateSignal(NETWORK_SIGNALS[1], sharedDeviceAccounts.length, snapshot); // SHARED_DEVICE
    }

    // DISPOSABLE_EMAIL
    if (email) {
        const domain = email.split("@")[1]?.toLowerCase();
        const isDisposable = domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
        score += evaluateSignal(NETWORK_SIGNALS[3], isDisposable ? 1 : 0, snapshot); // DISPOSABLE_EMAIL
    }

    // Initialize remaining
    for (const sig of NETWORK_SIGNALS) {
        if (!snapshot[sig.id]) {
            snapshot[sig.id] = { value: 0, fired: false, contribution: 0 };
        }
    }

    return Math.min(score, 100);
}

async function computeHistoryScore(userId: string, user: any, snapshot: SignalSnapshot): Promise<number> {
    let score = 0;

    // PAST_ENFORCEMENT: check if user was ever RED or BLACK
    const pastEnforcement = await prisma.riskEvent.count({
        where: {
            userId,
            eventType: "TIER_CHANGE",
            metadata: { path: ["newTier"], string_contains: "RED" },
        },
    });
    const pastSuspension = await prisma.riskEvent.count({
        where: {
            userId,
            eventType: "TIER_CHANGE",
            metadata: { path: ["newTier"], string_contains: "BLACK" },
        },
    });
    score += evaluateSignal(HISTORY_SIGNALS[0], pastEnforcement + pastSuspension > 0 ? 1 : 0, snapshot);

    // REVIEW_REMOVAL_RATE
    const totalReviewsGiven = user.reviewsGiven?.length || 0;
    const removedReviews = user.reviewsGiven?.filter((r: any) => r.deletedAt != null || r.status === "REJECTED").length || 0;
    const reviewRemovalRate = totalReviewsGiven > 0 ? removedReviews / totalReviewsGiven : 0;
    score += evaluateSignal(HISTORY_SIGNALS[1], reviewRemovalRate, snapshot);

    // REPORT_COUNT: count distinct reporters (via risk events)
    const reportEvents = await prisma.riskEvent.findMany({
        where: { userId, eventType: "USER_REPORTED" },
        select: { metadata: true },
    });
    const distinctReporters = new Set(
        reportEvents.map((e: any) => e.metadata?.reporterId).filter(Boolean)
    );
    score += evaluateSignal(HISTORY_SIGNALS[3], distinctReporters.size, snapshot);

    // NEW_ACCOUNT_HIGH_ACTIVITY
    const accountAgeDays = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (accountAgeDays < 7) {
        const actionCount = await prisma.tokenTransaction.count({
            where: { userId },
        });
        score += evaluateSignal(HISTORY_SIGNALS[4], actionCount, snapshot);
    }

    // Initialize remaining
    for (const sig of HISTORY_SIGNALS) {
        if (!snapshot[sig.id]) {
            snapshot[sig.id] = { value: 0, fired: false, contribution: 0 };
        }
    }

    return Math.min(score, 100);
}
