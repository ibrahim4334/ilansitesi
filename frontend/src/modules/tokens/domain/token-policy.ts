// ─── Token Policy ───────────────────────────────────────────────────────
// Domain rules for token spending. Pure logic — no DB access.
// Application layer calls these before executing transactions.

import { TOKEN_COSTS, DAILY_CAPS, PACKAGE_LIMITS } from "@/lib/package-system";
import { getRoleConfig } from "@/lib/role-config";
import type { PackageType } from "@/lib/db-types";

export type TokenAction = keyof typeof TOKEN_COSTS;

export class TokenPolicy {
    /**
     * Get the token cost for an action.
     */
    static getCost(action: TokenAction): number {
        return TOKEN_COSTS[action];
    }

    /**
     * Check if a role is allowed to perform an action.
     */
    static isActionAllowed(role: string, action: TokenAction): boolean {
        const config = getRoleConfig(role);
        const map: Record<TokenAction, boolean> = {
            OFFER_SEND: config.canSendOffer,
            DEMAND_UNLOCK: config.canUnlockDemand,
            BOOST: config.canBoostListing,
            SPOTLIGHT: config.canSpotlight,
            REPUBLISH: config.canRepublish,
            REFRESH: config.canRefresh,
        };
        return map[action] ?? false;
    }

    /**
     * Get the daily cap for an action + package combination.
     * Returns Infinity if no cap applies.
     */
    static getDailyCap(packageType: string, action: TokenAction): number {
        const caps = DAILY_CAPS[packageType as PackageType] || DAILY_CAPS.FREE;
        const map: Partial<Record<TokenAction, number>> = {
            OFFER_SEND: caps.offers,
            DEMAND_UNLOCK: caps.unlocks,
            BOOST: caps.boosts,
            SPOTLIGHT: caps.spotlights,
        };
        return map[action] ?? Infinity;
    }

    /**
     * Check if a user can afford an action.
     */
    static canAfford(balance: number, action: TokenAction): boolean {
        return balance >= TOKEN_COSTS[action];
    }

    /**
     * Full eligibility check (pure logic, no DB).
     */
    static checkEligibility(
        role: string,
        packageType: string,
        balance: number,
        action: TokenAction,
        todayActionCount: number,
    ): { eligible: boolean; reason?: string } {
        if (!this.isActionAllowed(role, action)) {
            return { eligible: false, reason: "ROLE_NOT_PERMITTED" };
        }

        const dailyCap = this.getDailyCap(packageType, action);
        if (todayActionCount >= dailyCap) {
            return { eligible: false, reason: "DAILY_CAP_REACHED" };
        }

        if (!this.canAfford(balance, action)) {
            return { eligible: false, reason: "INSUFFICIENT_TOKENS" };
        }

        return { eligible: true };
    }

    /**
     * Calculate new balance after monthly renewal with soft cap.
     */
    static calculateRenewal(currentBalance: number, packageType: string): number {
        const limits = PACKAGE_LIMITS[packageType as PackageType] || PACKAGE_LIMITS.FREE;
        return Math.min(currentBalance + limits.monthlyTokens, limits.softCap);
    }

    /**
     * Calculate initial grant for new users.
     */
    static getInitialGrant(packageType: string): number {
        const limits = PACKAGE_LIMITS[packageType as PackageType] || PACKAGE_LIMITS.FREE;
        return limits.initialTokens;
    }
}
