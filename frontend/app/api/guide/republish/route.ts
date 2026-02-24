import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSupply } from "@/lib/api-guards";
import { getRoleConfig } from "@/lib/role-config";
import { PackageSystem, TOKEN_COSTS } from "@/lib/package-system";
import { withSerializableRetry } from "@/lib/with-retry";
import { safeErrorMessage } from "@/lib/safe-error";

/**
 * POST /api/guide/republish
 * Republish an expired listing. Costs REPUBLISH tokens. Resets expiresAt.
 *
 * Body: { listingId: string }
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireSupply(session);
        if (guard) return guard;

        const roleConfig = getRoleConfig(session!.user.role);
        if (!roleConfig.canRepublish) {
            return NextResponse.json({ error: "Upgrade required to republish" }, { status: 403 });
        }

        const { listingId } = await req.json();
        if (!listingId) {
            return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
        }

        // Resolve user
        const user = await prisma.user.findUnique({
            where: { email: session!.user.email! },
            select: { id: true, packageType: true },
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Verify listing exists, belongs to user, and is EXPIRED
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
        });
        if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        if (listing.ownerId !== user.id) {
            return NextResponse.json({ error: "Not your listing" }, { status: 403 });
        }
        if (listing.status !== "EXPIRED") {
            return NextResponse.json({ error: "Listing is not expired" }, { status: 400 });
        }

        // Check active listing count (republishing = reactivating)
        const activeCount = await prisma.listing.count({
            where: { ownerId: user.id, status: "ACTIVE", deletedAt: null },
        });
        if (!PackageSystem.canCreateListing(user.packageType, activeCount)) {
            return NextResponse.json({
                error: "Active listing limit reached",
                limit: PackageSystem.getLimits(user.packageType).maxListings,
            }, { status: 403 });
        }

        const cost = TOKEN_COSTS.REPUBLISH;
        const idempotencyKey = `republish:${listingId}:${Date.now()}`;
        const newDuration = PackageSystem.getListingDuration(user.packageType);
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + newDuration);

        // Atomic: deduct token + reactivate listing
        try {
            const result = await withSerializableRetry(() => prisma.$transaction(async (tx) => {
                // (1) Lock + balance check
                const [balanceRow] = await tx.$queryRaw<[{ balance: number }]>`
                    SELECT COALESCE(SUM(amount), 0) AS balance
                    FROM token_transactions
                    WHERE userId = ${user.id}
                    FOR UPDATE
                `;
                const currentBalance = Number(balanceRow.balance);

                if (currentBalance - cost < 0) {
                    throw new Error("INSUFFICIENT_CREDITS");
                }

                // (2) Deduct tokens
                await tx.tokenTransaction.create({
                    data: {
                        userId: user.id,
                        type: "REPUBLISH",
                        amount: -cost,
                        reason: `Republish listing: ${listing.title}`,
                        relatedId: listingId,
                        idempotencyKey,
                    },
                });

                // (3) Update cached balance
                await tx.user.update({
                    where: { id: user.id },
                    data: { tokenBalance: { decrement: cost } },
                });

                // (4) Reactivate listing with new expiration
                await tx.listing.update({
                    where: { id: listingId },
                    data: {
                        status: "ACTIVE",
                        expiresAt: newExpiresAt,
                        updatedAt: new Date(), // Refresh ranking position
                    },
                });

                return { newBalance: currentBalance - cost };
            }, {
                isolationLevel: "Serializable",
                timeout: 10_000,
            }));

            console.log(`[Republish] Listing ${listingId} republished. Cost: ${cost}, Balance: ${result.newBalance}`);

            return NextResponse.json({
                success: true,
                message: "İlan yeniden yayınlandı",
                expiresAt: newExpiresAt.toISOString(),
                tokenBalance: result.newBalance,
            }, { status: 200 });

        } catch (error: any) {
            if (error.message === "INSUFFICIENT_CREDITS") {
                return NextResponse.json({
                    error: "INSUFFICIENT_CREDITS",
                    message: "Yetersiz Token",
                    cost,
                }, { status: 402 });
            }
            throw error;
        }

    } catch (error) {
        console.error("Republish error:", error);
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
    }
}
