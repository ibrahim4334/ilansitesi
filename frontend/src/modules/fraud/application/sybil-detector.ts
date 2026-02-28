// ─── Sybil Detector ─────────────────────────────────────────────────────
// Detects multi-account abuse via device and IP correlation.
// Designed to run as a batch job (daily), not real-time.

import { prisma } from "@/lib/prisma";

export interface SybilCluster {
    clusterKey: string;
    userIds: string[];
    linkType: "DEVICE" | "IP" | "BOTH";
    confidence: number;
}

/**
 * Detect Sybil clusters by finding users who share devices or IPs.
 * Run daily as a batch job.
 */
export async function detectSybilClusters(): Promise<SybilCluster[]> {
    const clusters: Map<string, SybilCluster> = new Map();

    // ── Device-based clustering ─────────────────────────────────────
    // Find fingerprints shared by multiple users
    const sharedDevices = await prisma.$queryRaw<
        { fingerprint: string; userIds: string }[]
    >`
        SELECT fingerprint, GROUP_CONCAT(DISTINCT userId) AS userIds
        FROM device_fingerprints
        WHERE createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY fingerprint
        HAVING COUNT(DISTINCT userId) > 1
    `;

    for (const row of sharedDevices) {
        const userIds = row.userIds.split(",");
        const key = `device:${row.fingerprint}`;
        clusters.set(key, {
            clusterKey: key,
            userIds,
            linkType: "DEVICE",
            confidence: 0.8,
        });
    }

    // ── IP-based clustering ─────────────────────────────────────────
    const sharedIPs = await prisma.$queryRaw<
        { ipAddress: string; userIds: string }[]
    >`
        SELECT ipAddress, GROUP_CONCAT(DISTINCT userId) AS userIds
        FROM device_fingerprints
        WHERE createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY ipAddress
        HAVING COUNT(DISTINCT userId) > 2
    `;

    for (const row of sharedIPs) {
        const userIds = row.userIds.split(",");
        const key = `ip:${row.ipAddress}`;

        // Check if these users also share devices (upgrade to BOTH)
        const existingDeviceCluster = [...clusters.values()].find(
            c => c.linkType === "DEVICE" && c.userIds.some(id => userIds.includes(id))
        );

        if (existingDeviceCluster) {
            const mergedUsers = [...new Set([...existingDeviceCluster.userIds, ...userIds])];
            existingDeviceCluster.userIds = mergedUsers;
            existingDeviceCluster.linkType = "BOTH";
            existingDeviceCluster.confidence = 0.95;
        } else {
            clusters.set(key, {
                clusterKey: key,
                userIds,
                linkType: "IP",
                confidence: 0.6, // IP alone has lower confidence (shared WiFi, etc.)
            });
        }
    }

    // ── Persist clusters as risk events ──────────────────────────────
    const result = [...clusters.values()].filter(c => c.userIds.length > 1);

    for (const cluster of result) {
        for (const userId of cluster.userIds) {
            // Avoid duplicate events
            const existing = await prisma.riskEvent.findFirst({
                where: {
                    userId,
                    eventType: "SYBIL_DETECTED",
                    createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
                },
            });

            if (!existing) {
                await prisma.riskEvent.create({
                    data: {
                        userId,
                        eventType: "SYBIL_DETECTED",
                        severity: cluster.confidence >= 0.8 ? "HIGH" : "MEDIUM",
                        metadata: {
                            clusterKey: cluster.clusterKey,
                            linkedUserIds: cluster.userIds.filter(id => id !== userId),
                            linkType: cluster.linkType,
                            confidence: cluster.confidence,
                        },
                    },
                });
            }
        }
    }

    console.log(`[Sybil] Detected ${result.length} clusters involving ${result.reduce((s, c) => s + c.userIds.length, 0)} users`);
    return result;
}
