import { prisma } from "./prisma";

// ─── Expiration Service ─────────────────────────────────────────────────
// Handles expiration of Listings, Demands, Offers, and featured badges.
// Called by cron job every 15 minutes.

export interface ExpirationResult {
    expiredListings: number;
    expiredDemands: number;
    expiredOffers: number;
    unfeatured: number;
    notifiedUsers: string[];
}

/**
 * Expire all stale entities in a single pass.
 * Safe to run concurrently (updateMany is idempotent).
 */
export async function runExpiration(): Promise<ExpirationResult> {
    const now = new Date();
    const notifiedUsers: string[] = [];

    // ── 1. Expire Listings ──────────────────────────────────────────
    const expiringListings = await prisma.guideListing.findMany({
        where: {
            active: true,
            endDate: { lte: now },
            deletedAt: null,
        },
        select: {
            id: true,
            title: true,
            guideId: true,
            guide: { select: { user: { select: { email: true, name: true } } } },
        },
    });

    // Batch update status
    const expiredListings = await prisma.guideListing.updateMany({
        where: {
            active: true,
            endDate: { lte: now },
            deletedAt: null,
        },
        data: { active: false },
    });

    // ── 2. Expire Demands (UmrahRequests) ───────────────────────────
    const expiringDemands = await prisma.umrahRequest.findMany({
        where: {
            status: "open",
            deletedAt: null,
        },
        select: {
            id: true,
            userEmail: true,
        },
    });

    const expiredDemands = await prisma.umrahRequest.updateMany({
        where: {
            status: "open",
            deletedAt: null,
        },
        data: { status: "closed" },
    });

    // ── 3. Expire Offers ────────────────────────────────────────────
    const expiredOffers = await prisma.offer.updateMany({
        where: {
            status: "pending",
            expiresAt: { lte: now },
        },
        data: { status: "expired" },
    });

    // ── 4. Remove expired featured badges ───────────────────────────
    // Use activeBoost table since 'featuredUntil' doesn't exist on GuideListing
    const expiredBoosts = await prisma.activeBoost.findMany({
        where: { expiresAt: { lte: now } },
        select: { listingId: true },
    });
    if (expiredBoosts.length > 0) {
        const expiredListingIds = expiredBoosts.map(b => b.listingId);
        await prisma.guideListing.updateMany({
            where: { id: { in: expiredListingIds }, isFeatured: true },
            data: { isFeatured: false },
        });
        await prisma.activeBoost.deleteMany({
            where: { expiresAt: { lte: now } },
        });
    }
    const unfeatured = { count: expiredBoosts.length };

    // ── 5. Queue notifications ──────────────────────────────────────
    for (const listing of expiringListings) {
        const email = listing.guide?.user?.email;
        const name = listing.guide?.user?.name;
        if (email) {
            notifiedUsers.push(email);
            await queueExpirationEmail(
                email,
                name || "Kullanıcı",
                "listing",
                listing.title,
                listing.id,
            );
        }
    }

    for (const demand of expiringDemands) {
        if (demand.userEmail) {
            notifiedUsers.push(demand.userEmail);
            await queueExpirationEmail(
                demand.userEmail,
                "Kullanıcı",
                "demand",
                `Talep #${demand.id.slice(-6)}`,
                demand.id,
            );
        }
    }

    const result = {
        expiredListings: expiredListings.count,
        expiredDemands: expiredDemands.count,
        expiredOffers: expiredOffers.count,
        unfeatured: unfeatured.count,
        notifiedUsers,
    };

    console.log(
        `[Expiration] Listings: ${result.expiredListings}, Demands: ${result.expiredDemands}, ` +
        `Offers: ${result.expiredOffers}, Unfeatured: ${result.unfeatured}, ` +
        `Notified: ${result.notifiedUsers.length}`
    );

    return result;
}

// ── Email Queue ─────────────────────────────────────────────────────────
// TODO: Replace with actual email service (SendGrid, Resend, etc.)

interface ExpirationEmailData {
    to: string;
    userName: string;
    entityType: "listing" | "demand";
    entityTitle: string;
    entityId: string;
    queuedAt: Date;
}

const emailQueue: ExpirationEmailData[] = [];

async function queueExpirationEmail(
    to: string,
    userName: string,
    entityType: "listing" | "demand",
    entityTitle: string,
    entityId: string,
): Promise<void> {
    const emailData: ExpirationEmailData = {
        to,
        userName,
        entityType,
        entityTitle,
        entityId,
        queuedAt: new Date(),
    };

    emailQueue.push(emailData);

    console.log(`[Email Queue] Expiration notification for ${to}: ${entityType} "${entityTitle}"`);
}

/**
 * Get pending emails (for testing/debugging).
 */
export function getEmailQueue(): ExpirationEmailData[] {
    return [...emailQueue];
}

/**
 * Flush email queue (for testing).
 */
export function clearEmailQueue(): void {
    emailQueue.length = 0;
}
