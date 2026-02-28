// ─── Real-Time Sybil Protection ─────────────────────────────────────────
// Lightweight real-time checks at registration and action time.
// Hybrid model: fast checks + batch daily deep analysis.

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
    type RegistrationBehavior,
    behavioralEntropyScore,
    validateBehaviorData,
} from "./behavioral-sybil";

// ─── Disposable Email Domains (top offenders) ───────────────────────────

const DISPOSABLE_DOMAINS = new Set([
    "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
    "yopmail.com", "tempail.com", "discard.email", "trashmail.com",
    "maildrop.cc", "getnada.com", "sharklasers.com", "guerrillamailblock.com",
    "fakeinbox.com", "tempmailaddress.com", "10minutemail.com",
]);

// ─── Registration-Time Sybil Check ──────────────────────────────────────

export type RegistrationDecision = "PASS" | "CHALLENGE" | "BLOCK";

interface RegistrationSignals {
    sharedIP: boolean;
    sharedDevice: boolean;
    disposableEmail: boolean;
    phoneMismatch: boolean;
    phoneReuse: boolean;
}

/**
 * Lightweight Sybil check at registration time.
 * Target: <20ms latency via indexed queries.
 *
 * PASS → allow registration
 * CHALLENGE → require SMS verification before account activation
 * BLOCK → deny registration
 */
export async function registrationSybilCheck(
    fingerprint: string | null,
    ipAddress: string,
    phone: string | null,
    email: string,
    behavior?: RegistrationBehavior, // NEW: behavioral entropy signal
): Promise<{
    decision: RegistrationDecision;
    signals: RegistrationSignals;
    score: number;
}> {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600 * 1000);

    // Run all checks in parallel for speed
    const [ipRegCount, deviceUserCount, phoneLinkedToBan] = await Promise.all([
        // 1. Shared IP: >2 registrations from same IP in 1 hour
        prisma.deviceFingerprint.groupBy({
            by: ["userId"],
            where: { ipAddress, createdAt: { gte: oneHourAgo } },
        }).then(r => r.length),

        // 2. Shared device: fingerprint already linked to another user in 24h
        fingerprint
            ? prisma.deviceFingerprint.groupBy({
                by: ["userId"],
                where: { fingerprint, createdAt: { gte: twentyFourHoursAgo } },
            }).then(r => r.length)
            : Promise.resolve(0),

        // 3. Phone reuse: phone linked to a banned account
        phone
            ? prisma.user.findFirst({
                where: {
                    phone,
                    role: "BANNED",
                },
                select: { id: true },
            })
            : Promise.resolve(null),
    ]);

    // Build signals
    const emailDomain = email.split("@")[1]?.toLowerCase() ?? "";
    const signals: RegistrationSignals = {
        sharedIP: ipRegCount > 2,
        sharedDevice: deviceUserCount > 0,
        disposableEmail: DISPOSABLE_DOMAINS.has(emailDomain),
        phoneMismatch: phone ? !phone.startsWith("+90") : false,
        phoneReuse: phoneLinkedToBan !== null,
    };

    // Score calculation: infrastructure signals
    const infraScore =
        (signals.sharedIP ? 25 : 0) +
        (signals.sharedDevice ? 35 : 0) +
        (signals.disposableEmail ? 15 : 0) +
        (signals.phoneMismatch ? 10 : 0) +
        (signals.phoneReuse ? 50 : 0);

    // Behavioral entropy score (NEW — defeats eSIM + anti-fingerprint)
    let behaviorPenalty = 0;
    if (behavior && validateBehaviorData(behavior)) {
        behaviorPenalty = Math.round(behavioralEntropyScore(behavior) * 0.7);
    }

    const score = infraScore + behaviorPenalty;

    let decision: RegistrationDecision;
    if (score >= 50) decision = "BLOCK";
    else if (score >= 25) decision = "CHALLENGE";
    else decision = "PASS";

    // Log high-risk registration attempts
    if (score >= 25) {
        // Fire-and-forget — don't block registration on logging
        prisma.riskEvent.create({
            data: {
                userId: "REGISTRATION_ATTEMPT",
                eventType: "SYBIL_REGISTRATION_CHECK",
                severity: score >= 50 ? "HIGH" : "MEDIUM",
                metadata: { signals, score, decision, email: email.slice(0, 3) + "***", ipAddress } as unknown as Prisma.InputJsonValue,
            },
        }).catch(() => { /* non-blocking */ });
    }

    return { decision, signals, score };
}

// ─── Action-Time Sybil Gate ─────────────────────────────────────────────

/**
 * Lightweight check before sensitive actions (BOOST, OFFER_SEND, REVIEW_SUBMIT).
 * Reads pre-computed risk tier (O(1)) + cached Sybil cluster membership.
 */
export async function actionSybilGate(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
}> {
    // 1. Check risk tier (pre-computed, indexed)
    const riskScore = await prisma.riskScore.findUnique({
        where: { userId },
        select: { tier: true, signals: true },
    });

    if (riskScore?.tier === "RED" || riskScore?.tier === "BLACK") {
        return { allowed: false, reason: "High risk tier" };
    }

    // 2. Check for recent Sybil detection events
    const recentSybil = await prisma.riskEvent.findFirst({
        where: {
            userId,
            eventType: "SYBIL_DETECTED",
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
        },
        select: { metadata: true },
    });

    if (recentSybil) {
        const meta = recentSybil.metadata as any;
        if (meta?.confidence >= 0.8) {
            return { allowed: false, reason: "Sybil cluster detected" };
        }
    }

    return { allowed: true };
}

// ─── Phone Number Weighting for URS ─────────────────────────────────────

/**
 * Computes phone-based trust adjustment for URS.
 * Turkish +90 5XX numbers require national ID → strong identity signal.
 */
export function phoneIdentityScore(phone: string | null, isVerified: boolean): number {
    if (!phone) return 0;

    // Turkish mobile number verified → trust bonus
    if (phone.startsWith("+90") && isVerified) return -15; // Reduces URS by 15

    // Non-Turkish number → slight risk
    if (!phone.startsWith("+90")) return 5;

    // Turkish but not verified → neutral
    return 0;
}
