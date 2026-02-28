import { prisma } from "@/lib/prisma";
import { TokenService } from "../tokens/TokenService"; // Adjust this import based on actual file path
import { getVelocityCount, checkVelocity } from "../../fraud/infrastructure/velocity-counter";
// NOTE: Recheck the exact import path to TokenService when integrating

export class BoostGuardrailService {
    /**
     * Applies a Boost to a listing with Economic Guardrails.
     * Enforces: Trust gates per tier, sliding window limits, progressive pricing.
     *
     * Boost Tiers:
     *   BASIC:   Trust ≥ 40, 50 tokens, 24h duration
     *   PREMIUM: Trust ≥ 60, 120 tokens, 48h duration
     *   ELITE:   Trust ≥ 75, 250 tokens, 72h duration
     */
    static async applyBoost(
        userId: string,
        listingId: string,
        boostTier: "BASIC" | "PREMIUM" | "ELITE" = "BASIC",
    ): Promise<{ success: boolean; effectivePower: number; cost: number; alreadyProcessed: boolean; boostTier: string }> {
        // 1. Fetch User Trust Info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { trustScore: true }
        });

        if (!user) throw new Error("User not found.");

        const trustScore = user.trustScore;

        // 2. Trust Gate per Tier
        const TRUST_GATES = { BASIC: 40, PREMIUM: 60, ELITE: 75 } as const;
        if (trustScore < TRUST_GATES[boostTier]) {
            throw new Error(
                `Trust score ${trustScore} is below the ${boostTier} boost requirement (${TRUST_GATES[boostTier]}). ` +
                `Earn trust by completing organic trips with high ratings.`
            );
        }

        // Hard block: trust < 40 = no boost at all
        if (trustScore < 40) {
            throw new Error("Boost not allowed due to low trust score.");
        }

        // 3. Tier-specific configuration
        const TIER_CONFIG = {
            BASIC: { baseCost: 50, durationHours: 24, rawPower: 0.30 },
            PREMIUM: { baseCost: 120, durationHours: 48, rawPower: 0.60 },
            ELITE: { baseCost: 250, durationHours: 72, rawPower: 0.85 },
        };

        const config = TIER_CONFIG[boostTier];

        // 4. Trust Factor for effective power
        let trustFactor = 1.0;
        if (trustScore >= 60 && trustScore <= 79) trustFactor = 0.8;
        else if (trustScore >= 40 && trustScore <= 59) trustFactor = 0.5;

        // ── 5. Sliding Window Checks (via persistent velocity counter) ──
        const listingBoostCount = await getVelocityCount(listingId, "BOOST_LISTING", 86400);
        if (listingBoostCount >= 3) {
            throw new Error("Daily maximum boost limit (3) reached for this listing.");
        }

        const portfolioCount = await getVelocityCount(userId, "BOOST_PORTFOLIO", 86400);
        if (portfolioCount >= 9) {
            throw new Error("Günlük toplam boost limiti (9) aşıldı.");
        }

        // Fraud velocity check
        const velocityResult = await checkVelocity(userId, "BOOST");
        if (!velocityResult.allowed) {
            throw new Error("Boost rate limit exceeded. Please try again later.");
        }

        // Execute in strict Isolation Level
        return await prisma.$transaction(async (tx) => {
            // 6. Progressive Surge Pricing (based on daily count)
            let cost = config.baseCost;
            if (listingBoostCount === 1) cost = Math.round(config.baseCost * 1.5);
            if (listingBoostCount === 2) cost = Math.round(config.baseCost * 2.0);

            // 7. Calculate effectivePower (trust × rawPower × diminishing returns)
            const diminishingFactor = 1 / (listingBoostCount + 1);
            const effectivePower = Math.min(config.rawPower * trustFactor * diminishingFactor, 1.0);

            // 8. Consume Tokens with server-side idempotency
            const consumeResult = await TokenService.consumeTokens(userId, cost, "BOOST_LISTING", `lst_${listingId}`, tx);

            if (consumeResult.alreadyProcessed) {
                return { success: true, effectivePower, cost, alreadyProcessed: true, boostTier };
            }

            // 9. Record in velocity counters
            const windowKey = new Date().toISOString().slice(0, 13);
            await tx.$executeRaw`
                INSERT INTO velocity_counters (id, userId, action, windowKey, count, createdAt)
                VALUES (${`bc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`}, ${listingId}, 'BOOST_LISTING', ${windowKey}, 1, NOW())
                ON DUPLICATE KEY UPDATE count = count + 1
            `;
            await tx.$executeRaw`
                INSERT INTO velocity_counters (id, userId, action, windowKey, count, createdAt)
                VALUES (${`bp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`}, ${userId}, 'BOOST_PORTFOLIO', ${windowKey}, 1, NOW())
                ON DUPLICATE KEY UPDATE count = count + 1
            `;

            // 10. Create Active Boost with tier-specific duration
            const expiresAt = new Date(Date.now() + config.durationHours * 60 * 60 * 1000);
            await tx.activeBoost.create({
                data: {
                    listingId,
                    userId,
                    effectivePower,
                    expiresAt,
                    boostType: boostTier, // Store tier for ranking engine
                }
            });

            return {
                success: true,
                effectivePower,
                cost,
                alreadyProcessed: false,
                boostTier,
            };

        }, { isolationLevel: 'RepeatableRead' });
    }
}

