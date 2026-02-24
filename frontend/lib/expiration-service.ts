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
    // First, collect listings about to expire (for notifications)
    const expiringListings = await prisma.listing.findMany({
        where: {
            status: "ACTIVE",
            expiresAt: { lte: now },
            deletedAt: null,
        },
        select: {
            id: true,
            title: true,
            ownerId: true,
            owner: { select: { email: true, name: true } },
        },
    });

    // Batch update status
    const expiredListings = await prisma.listing.updateMany({
        where: {
            status: "ACTIVE",
            expiresAt: { lte: now },
            deletedAt: null,
        },
        data: { status: "EXPIRED" },
    });

    // ── 2. Expire Demands ───────────────────────────────────────────
    const expiringDemands = await prisma.demand.findMany({
        where: {
            status: "OPEN",
            expiresAt: { lte: now },
            deletedAt: null,
        },
        select: {
            id: true,
            createdBy: true,
            creator: { select: { email: true, name: true } },
        },
    });

    const expiredDemands = await prisma.demand.updateMany({
        where: {
            status: "OPEN",
            expiresAt: { lte: now },
            deletedAt: null,
        },
        data: { status: "EXPIRED" },
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
    const unfeatured = await prisma.listing.updateMany({
        where: {
            isFeatured: true,
            featuredUntil: { lte: now },
        },
        data: {
            isFeatured: false,
            featuredUntil: null,
            boostScore: 0,
        },
    });

    // ── 5. Queue notifications ──────────────────────────────────────
    for (const listing of expiringListings) {
        if (listing.owner?.email) {
            notifiedUsers.push(listing.owner.email);
            await queueExpirationEmail(
                listing.owner.email,
                listing.owner.name || "Kullanıcı",
                "listing",
                listing.title,
                listing.id,
            );
        }
    }

    for (const demand of expiringDemands) {
        if (demand.creator?.email) {
            notifiedUsers.push(demand.creator.email);
            await queueExpirationEmail(
                demand.creator.email,
                demand.creator.name || "Kullanıcı",
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

    // In production, send via email service:
    // await sendEmail({
    //     to: emailData.to,
    //     subject: entityType === "listing"
    //         ? `İlanınız süresi doldu: ${entityTitle}`
    //         : `Talebiniz süresi doldu: ${entityTitle}`,
    //     html: buildExpirationEmailHtml(emailData),
    // });

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
