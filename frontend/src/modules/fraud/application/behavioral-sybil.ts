// ─── Behavioral Sybil Detection Layer ───────────────────────────────────
// Lightweight behavioral signals that can't be defeated by buying more
// infrastructure (eSIMs, VPNs, anti-fingerprint browsers).
// Requires human-speed interaction or expensive automation tooling.
//
// Cost escalation: $5/account → $22+/account

import { prisma } from "@/lib/prisma";

// ─── Registration Behavior Scoring ──────────────────────────────────────

/**
 * Client-side collected behavioral metrics.
 * Transmitted as a single JSON blob on registration form submit.
 * No PII — only timing and interaction entropy.
 */
export interface RegistrationBehavior {
    pageLoadToFirstKeystrokeMs: number;  // Bot: <100ms, Human: 500-3000ms
    totalFormTimeMs: number;             // Bot: <5s, Human: 15-120s
    fieldTabCount: number;               // Bot: 0, Human: 3-8
    pasteEvents: number;                 // Bot: all fields pasted, Human: 0-1
    mouseMovements: number;              // Bot: 0, Human: 10-50+
    scrollEvents: number;               // Bot: 0, Human: 1-5
    keystrokeDeltasMs: number[];         // Inter-key timing for entropy calc
}

/**
 * Score registration behavior. Higher = more suspicious.
 * Range: 0–65. Added to infrastructure score for combined decision.
 *
 * Why this works: Infrastructure signals (IP, device, phone) can be
 * bought. Behavioral signals require either a real human or Selenium
 * with realistic mouse movement injection ($15-20/session).
 */
export function behavioralEntropyScore(b: RegistrationBehavior): number {
    let score = 0;

    // 1. First keystroke speed (bots type instantly)
    if (b.pageLoadToFirstKeystrokeMs < 200) score += 15;
    else if (b.pageLoadToFirstKeystrokeMs < 400) score += 8;

    // 2. Total form completion time (humans take 15-120s)
    if (b.totalFormTimeMs < 3000) score += 20;
    else if (b.totalFormTimeMs < 8000) score += 10;

    // 3. Tab navigation (humans use tab; bots set values directly)
    if (b.fieldTabCount === 0 && b.totalFormTimeMs > 5000) score += 5;

    // 4. Paste events (password managers = 1 paste; bots = multiple)
    if (b.pasteEvents >= 3) score += 10;
    else if (b.pasteEvents === 2) score += 5;

    // 5. Mouse movement absence (strongest signal)
    if (b.mouseMovements < 3) score += 15;
    else if (b.mouseMovements < 8) score += 5;

    // 6. Keystroke entropy (humans have variable timing; bots are regular)
    if (b.keystrokeDeltasMs && b.keystrokeDeltasMs.length >= 5) {
        const stdDev = computeStdDev(b.keystrokeDeltasMs);
        if (stdDev < 15) score += 10; // Machine-like regularity (<15ms σ)
    }

    return score;
}

/**
 * Validate that behavior data is plausible (not forged by attacker).
 * Returns false if data looks fabricated.
 */
export function validateBehaviorData(b: RegistrationBehavior): boolean {
    // Basic sanity checks
    if (b.pageLoadToFirstKeystrokeMs < 0) return false;
    if (b.totalFormTimeMs < 0 || b.totalFormTimeMs > 600_000) return false; // >10min = stale
    if (b.fieldTabCount < 0 || b.fieldTabCount > 100) return false;
    if (b.mouseMovements < 0 || b.mouseMovements > 10_000) return false;

    // Cannot have more paste events than fields
    if (b.pasteEvents > 20) return false;

    // Keystroke deltas must be positive
    if (b.keystrokeDeltasMs?.some(d => d < 0 || d > 30_000)) return false;

    return true;
}

// ─── First-24h Action Cadence Check ─────────────────────────────────────

/**
 * Analyze the first 24 hours of a user's actions for bot-like patterns.
 * Run as a background check after user's 10th action.
 *
 * Bots: near-constant intervals (σ < 2s), many actions
 * Humans: highly variable intervals (σ > 10s), moderate actions
 */
export async function first24hCadenceCheck(userId: string): Promise<{
    score: number;
    isAutomated: boolean;
    intervalStdDev: number;
}> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
    });

    if (!user) return { score: 0, isAutomated: false, intervalStdDev: Infinity };

    const twentyFourHoursAfterRegistration = new Date(
        user.createdAt.getTime() + 24 * 3600 * 1000
    );

    // Get action timestamps from velocity counters
    const actions = await prisma.velocityCounter.findMany({
        where: {
            userId,
            createdAt: {
                gte: user.createdAt,
                lte: twentyFourHoursAfterRegistration,
            },
        },
        orderBy: { createdAt: "asc" },
        take: 30,
    });

    if (actions.length < 5) {
        return { score: 0, isAutomated: false, intervalStdDev: Infinity };
    }

    // Compute inter-action intervals
    const intervals: number[] = [];
    for (let i = 1; i < actions.length; i++) {
        intervals.push(
            actions[i].createdAt.getTime() - actions[i - 1].createdAt.getTime()
        );
    }

    const stdDev = computeStdDev(intervals);
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    let score = 0;

    // Machine-like regularity
    if (stdDev < 2000) score += 25;
    else if (stdDev < 5000) score += 10;

    // Too many actions in 24h for a new user
    if (actions.length > 20) score += 10;
    else if (actions.length > 15) score += 5;

    // Coefficient of variation: bots have CV < 0.3, humans > 0.5
    const cv = mean > 0 ? stdDev / mean : 0;
    if (cv < 0.2) score += 15;
    else if (cv < 0.3) score += 5;

    const isAutomated = score >= 30;

    // If automated behavior detected, increment URS
    if (isAutomated) {
        await prisma.riskEvent.create({
            data: {
                userId,
                eventType: "BEHAVIORAL_ANOMALY",
                severity: "MEDIUM",
                metadata: {
                    type: "FIRST_24H_CADENCE",
                    intervalStdDev: Math.round(stdDev),
                    intervalMean: Math.round(mean),
                    cv: Math.round(cv * 100) / 100,
                    actionCount: actions.length,
                    score,
                },
            },
        });
    }

    return { score, isAutomated, intervalStdDev: stdDev };
}

// ─── Helpers ────────────────────────────────────────────────────────────

function computeStdDev(values: number[]): number {
    if (values.length < 2) return Infinity;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => (v - mean) ** 2);
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}
