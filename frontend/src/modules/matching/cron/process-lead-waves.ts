// ─── Lead Routing Cron Job ──────────────────────────────────────────────
// Runs periodically (e.g., via node-cron or Vercel Cron) to process leads
// that are queued for the next chronological wave of distribution.

import { prisma } from '@/lib/prisma';
import { LeadMatchingService, WaveTier } from '@/src/modules/matching/application/LeadMatchingService';

/**
 * Searches for all active lead routing logs where the next wave timer has
 * expired, and pushes them to the next distribution wave.
 */
export async function processLeadRoutingWaves() {
    console.log(`[Cron] Starting Lead Routing Wave Processor...`);
    const now = new Date();

    const pendingLogs = await prisma.leadRoutingLog.findMany({
        where: {
            status: "ROUTING",
            nextWaveAt: { lte: now } // Timer has expired
        }
    });

    if (pendingLogs.length === 0) {
        console.log(`[Cron] No pending waves to process.`);
        return;
    }

    console.log(`[Cron] Found ${pendingLogs.length} leads ready for wave advancement.`);

    let processedCount = 0;
    for (const log of pendingLogs) {
        try {
            const nextWaveToExecute = log.currentWave as WaveTier; // This should be incremented via service

            // Re-eval lock status just in case (e.g. they hit 5 offers right before cron)
            if (log.offersReceived >= 5) {
                await LeadMatchingService.lockRequest(log.requestId);
                continue;
            }

            // Execute the next wave
            const result = await LeadMatchingService.executeWave(log.requestId, nextWaveToExecute);

            if (result.success && !result.isLocked) {
                processedCount++;
            }
        } catch (error) {
            console.error(`[Cron] Failed to process wave for Lead ${log.requestId}:`, error);
        }
    }

    console.log(`[Cron] Successfully processed ${processedCount}/${pendingLogs.length} waves.`);
}

/**
 * In a real Next.js environment (e.g., App Router Route Handler /api/cron/process-waves)
 * this would be invoked automatically. Example:
 */
export async function GET(request: Request) {
    // Basic auth check for cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    await processLeadRoutingWaves();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
}
