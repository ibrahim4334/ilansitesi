// ─── Lead Matching Engine (Wave-Based Distribution) ─────────────────────────
// Controls which agencies receive notifications for new customer leads based
// on chronological waves. Prioritizes premium plans and high SLA agencies first.

import { prisma } from '@/lib/prisma';
import { PackageSystem } from '@/lib/package-system';

export type WaveTier = 1 | 2 | 3;

interface RouteResult {
    success: boolean;
    wave: WaveTier;
    dispatchedCount: number;
    isLocked: boolean;
}

export class LeadMatchingService {
    // ── Wave Configurations ──
    private static readonly WAVE_TIMINGS = {
        WAVE_1_HOURS: 0,
        WAVE_2_HOURS: 1,
        WAVE_3_HOURS: 3,
    };

    private static readonly MAX_OFFERS_PER_LEAD = 5;

    /**
     * Entry point: Called immediately when a new UmrahRequest is created.
     */
    static async initializeRouting(requestId: string): Promise<void> {
        // 1. Create the routing log
        await prisma.leadRoutingLog.create({
            data: {
                requestId,
                currentWave: 1,
                status: "ROUTING",
                nextWaveAt: new Date(Date.now() + this.WAVE_TIMINGS.WAVE_2_HOURS * 3600000), // Next wave in 1 hours
            }
        });

        // 2. Immediately execute Wave 1
        await this.executeWave(requestId, 1);
    }

    /**
     * Executes a specific wave of distribution for a given request.
     */
    static async executeWave(requestId: string, wave: WaveTier): Promise<RouteResult> {
        const log = await prisma.leadRoutingLog.findUnique({
            where: { requestId },
            include: { request: true }
        });

        if (!log || log.status !== "ROUTING") {
            return { success: false, wave, dispatchedCount: 0, isLocked: true };
        }

        // Safety lock check
        if (log.offersReceived >= this.MAX_OFFERS_PER_LEAD) {
            await this.lockRequest(requestId);
            return { success: true, wave, dispatchedCount: 0, isLocked: true };
        }

        const eligibleGuideIds = await this.findEligibleAgencies(log.request, wave, log.dispatchedTo);

        if (eligibleGuideIds.length > 0) {
            // Pseudo-code implementation for Notification/Email dispatch
            console.log(`[MatchingEngine] Dispatching Lead ${requestId} to ${eligibleGuideIds.length} agencies in Wave ${wave}.`);
            // await EventBus.emit("LEAD_DISPATCHED", { requestId, agencyIds: eligibleGuideIds });

            // Mark as dispatched
            await prisma.leadRoutingLog.update({
                where: { id: log.id },
                data: {
                    dispatchedTo: { push: eligibleGuideIds },
                }
            });
        }

        // Advance Wave State
        if (wave === 1) {
            await prisma.leadRoutingLog.update({
                where: { id: log.id },
                data: { currentWave: 2, nextWaveAt: new Date(Date.now() + (this.WAVE_TIMINGS.WAVE_3_HOURS - this.WAVE_TIMINGS.WAVE_2_HOURS) * 3600000) }
            });
        } else if (wave === 2) {
            await prisma.leadRoutingLog.update({
                where: { id: log.id },
                data: { currentWave: 3, nextWaveAt: new Date(Date.now() + 86400000 * 30) } // Far future, open pool
            });
        }

        return { success: true, wave, dispatchedCount: eligibleGuideIds.length, isLocked: false };
    }

    /**
     * Finds agencies matching the strict criteria for the given wave.
     */
    private static async findEligibleAgencies(request: any, wave: WaveTier, alreadyDispatched: string[]): Promise<string[]> {
        // Find guides who serve this departure city
        // (Assuming listings represent their servicing areas for now)
        const relevantListings = await prisma.guideListing.findMany({
            where: {
                city: request.departureCity,
                status: "PUBLISHED",
                guideId: { notIn: alreadyDispatched }
            },
            select: { guideId: true },
            distinct: ['guideId']
        });

        const rawCandidateIds = relevantListings.map(l => l.guideId);

        if (rawCandidateIds.length === 0) return [];

        // Fetch their packages and performance data
        const candidates = await prisma.user.findMany({
            where: {
                id: { in: rawCandidateIds },
                role: "GUIDE"
            },
            include: {
                performanceTier: true,
                slaMetrics: true
            }
        });

        return candidates.filter(guide => {
            const pkg = guide.packageType || "FREE";
            const perf = guide.performanceTier?.tier || "BRONZE";
            const slaHours = guide.slaMetrics?.[0]?.avgResponseSeconds ? guide.slaMetrics[0].avgResponseSeconds / 3600 : 999;

            switch (wave) {
                case 1:
                    // Wave 1: Vanguard (Top Tiers, Gold+, < 2h SLA)
                    return ["LEGEND", "CORP_PRO", "CORP_ENTERPRISE"].includes(pkg) &&
                        ["GOLD", "PLATINUM"].includes(perf) &&
                        slaHours <= 2.0;
                case 2:
                    // Wave 2: Core (Pro+, Silver+, < 12h SLA)
                    return ["LEGEND", "CORP_PRO", "CORP_ENTERPRISE", "PRO", "CORP_BASIC"].includes(pkg) &&
                        ["SILVER", "GOLD", "PLATINUM"].includes(perf) &&
                        slaHours <= 12.0;
                case 3:
                    // Wave 3: Open Pool (Anyone left)
                    return true;
                default:
                    return false;
            }
        }).map(c => c.id);
    }

    /**
     * Marks a LeadRoutingLog as SATISFIED because it hit the 5-offer cap.
     */
    static async lockRequest(requestId: string): Promise<void> {
        await prisma.leadRoutingLog.update({
            where: { requestId },
            data: { status: "SATISFIED" }
        });

        // Pseudo-code implementation for Notification
        // Notify customers that they have enough offers, and notify remaining
        // agencies who viewed it that the lead is closed.
        console.log(`[MatchingEngine] Lead ${requestId} LOCKED (5 Offers Reached). Removing from pool.`);
    }

    /**
     * Called when an agency successfully sends an offer using DEMAND_UNLOCK.
     */
    static async recordOfferSent(requestId: string): Promise<void> {
        const log = await prisma.leadRoutingLog.update({
            where: { requestId },
            data: { offersReceived: { increment: 1 } }
        });

        if (log.offersReceived >= this.MAX_OFFERS_PER_LEAD) {
            await this.lockRequest(requestId);
        }
    }
}
