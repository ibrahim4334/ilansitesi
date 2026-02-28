// ─── Upgrade Triggers ───────────────────────────────────────────────────
// Returns contextual upgrade suggestions based on user's current state.
// Called at API boundaries when caps/limits are hit.
//
// Usage:
//   const trigger = await getUpgradeTrigger(userId, "OFFER_CAP_HIT");
//   if (trigger) res.json({ ...response, upgradeSuggestion: trigger });

import { prisma } from "@/lib/prisma";
import {
    PACKAGE_LIMITS,
    PLAN_PRICES_TRY,
    BOOST_TIER_ACCESS,
} from "@/lib/package-system";
import type { PackageType } from "@/lib/db-types";

// ─── Trigger Contexts ───────────────────────────────────────────────────

export type TriggerContext =
    | "TOKEN_DEPLETED"       // Balance hit 0
    | "OFFER_CAP_HIT"       // Daily offer limit reached
    | "BOOST_CAP_HIT"       // Daily boost limit reached
    | "BOOST_TIER_BLOCKED"  // Tried Premium/Elite without access
    | "LISTING_CAP_HIT"    // Max listings reached
    | "DEMAND_UNLOCK_BLOCKED" // Free user tried to unlock demand
    | "FIRST_WEEK_NUDGE"    // 7 days on free plan
    | "INACTIVE_NUDGE"      // 30 days with 0 offers sent
    | "PHONE_HIDDEN"        // Tried to show phone on free plan
    ;

export interface UpgradeTrigger {
    context: TriggerContext;
    suggestedPlan: PackageType;
    message_tr: string;           // Turkish user-facing message
    message_en: string;           // English fallback
    currentPlanPrice: number;
    suggestedPlanPrice: number;
    savingsPercentage?: number;   // If annual billing
}

// ─── Trigger Logic ──────────────────────────────────────────────────────

/**
 * Get an upgrade suggestion based on the trigger context.
 * Returns null if user is already on the max plan for the category.
 */
export async function getUpgradeTrigger(
    userId: string,
    context: TriggerContext,
): Promise<UpgradeTrigger | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { packageType: true, role: true },
    });

    if (!user) return null;

    const current = user.packageType as PackageType;
    const isCorp = current.startsWith("CORP_") || user.role === "CORPORATE";

    // Determine suggested plan
    const suggested = getSuggestedPlan(current, context, isCorp);
    if (!suggested) return null;

    const messages = getTriggerMessages(context, suggested);

    return {
        context,
        suggestedPlan: suggested,
        message_tr: messages.tr,
        message_en: messages.en,
        currentPlanPrice: PLAN_PRICES_TRY[current] ?? 0,
        suggestedPlanPrice: PLAN_PRICES_TRY[suggested] ?? 0,
        savingsPercentage: 14, // Annual saving
    };
}

// ─── Plan Suggestion Matrix ─────────────────────────────────────────────

function getSuggestedPlan(
    current: PackageType,
    context: TriggerContext,
    isCorp: boolean,
): PackageType | null {
    // Already max plan
    if (current === "LEGEND" || current === "CORP_ENTERPRISE") return null;

    // Corporate users → corporate upgrade path
    if (isCorp) {
        if (current === "CORP_PRO") return "CORP_ENTERPRISE";
        if (current === "CORP_BASIC") return "CORP_PRO";
        return "CORP_BASIC";
    }

    // Guide upgrade paths by context
    switch (context) {
        case "TOKEN_DEPLETED":
        case "OFFER_CAP_HIT":
        case "DEMAND_UNLOCK_BLOCKED":
        case "FIRST_WEEK_NUDGE":
        case "INACTIVE_NUDGE":
            // Gentlest push: next tier up
            if (current === "FREE") return "STARTER";
            if (current === "STARTER") return "PRO";
            return "LEGEND";

        case "BOOST_TIER_BLOCKED":
        case "BOOST_CAP_HIT":
            // Boost-focused: jump to PRO minimum
            if (current === "FREE" || current === "STARTER") return "PRO";
            return "LEGEND";

        case "LISTING_CAP_HIT":
            // Listings: PRO has 5 (same as LEGEND)
            if (current === "FREE") return "STARTER";
            return "PRO";

        case "PHONE_HIDDEN":
            // Phone visibility starts at PRO
            if (current === "FREE" || current === "STARTER") return "PRO";
            return null;

        default:
            if (current === "FREE") return "STARTER";
            if (current === "STARTER") return "PRO";
            return "LEGEND";
    }
}

// ─── Trigger Messages ───────────────────────────────────────────────────

function getTriggerMessages(
    context: TriggerContext,
    suggested: PackageType,
): { tr: string; en: string } {
    const price = PLAN_PRICES_TRY[suggested];

    const messages: Record<TriggerContext, { tr: string; en: string }> = {
        TOKEN_DEPLETED: {
            tr: `Tokenlarınız tükendi. ${suggested} planıyla aylık ${PACKAGE_LIMITS[suggested].monthlyTokens} token kazanın. Sadece ₺${price}/ay.`,
            en: `Tokens depleted. Get ${PACKAGE_LIMITS[suggested].monthlyTokens} monthly tokens with ${suggested} plan. Only ₺${price}/mo.`,
        },
        OFFER_CAP_HIT: {
            tr: `Günlük teklif limitinize ulaştınız. ${suggested} planıyla günde ${PACKAGE_LIMITS[suggested].maxDailyOffers} teklif gönderin.`,
            en: `Daily offer limit reached. Send ${PACKAGE_LIMITS[suggested].maxDailyOffers} offers/day with ${suggested}.`,
        },
        BOOST_CAP_HIT: {
            tr: `Boost limitinize ulaştınız. ${suggested} planıyla günde ${PACKAGE_LIMITS[suggested].maxBoosts} boost yapın.`,
            en: `Boost limit reached. Get ${PACKAGE_LIMITS[suggested].maxBoosts} daily boosts with ${suggested}.`,
        },
        BOOST_TIER_BLOCKED: {
            tr: `Premium/Elite boost'a erişmek için ${suggested} planına geçin. Sadece ₺${price}/ay.`,
            en: `Upgrade to ${suggested} for Premium/Elite boost access. Only ₺${price}/mo.`,
        },
        LISTING_CAP_HIT: {
            tr: `İlan limitinize ulaştınız. ${suggested} planıyla ${PACKAGE_LIMITS[suggested].maxListings} ilan oluşturun.`,
            en: `Listing limit reached. Create ${PACKAGE_LIMITS[suggested].maxListings} listings with ${suggested}.`,
        },
        DEMAND_UNLOCK_BLOCKED: {
            tr: `Talepleri görmek için ${suggested} planına geçin. ₺${price}/ay ile ${PACKAGE_LIMITS[suggested].maxDailyOffers} teklif/gün.`,
            en: `Upgrade to ${suggested} to unlock demands. ₺${price}/mo.`,
        },
        FIRST_WEEK_NUDGE: {
            tr: `Pro rehberler %40 daha fazla başvuru alıyor. ${suggested} planına yükseltin! Sadece ₺${price}/ay.`,
            en: `Pro guides get 40% more applications. Upgrade to ${suggested}! Only ₺${price}/mo.`,
        },
        INACTIVE_NUDGE: {
            tr: `Son 30 günde 0 teklif gönderdiniz. ${suggested} planıyla ${PACKAGE_LIMITS[suggested].monthlyTokens} token/ay kazanın.`,
            en: `0 offers in last 30 days. Earn ${PACKAGE_LIMITS[suggested].monthlyTokens} tokens/mo with ${suggested}.`,
        },
        PHONE_HIDDEN: {
            tr: `Telefon numaranızın görünmesi için ${suggested} planına geçin. Direkt iletişim, daha hızlı rezervasyon!`,
            en: `Show your phone number with ${suggested} plan. Direct contact, faster bookings!`,
        },
    };

    return messages[context] || {
        tr: `${suggested} planına yükseltin. ₺${price}/ay.`,
        en: `Upgrade to ${suggested}. ₺${price}/mo.`,
    };
}
