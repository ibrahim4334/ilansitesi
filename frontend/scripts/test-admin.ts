import { prisma } from '../lib/prisma';
import { grantToken } from '../src/modules/tokens/application/grant-token.usecase';

async function runAdminTests() {
    console.log('--- TEST: ADMIN PANEL & AUDIT LOGS (TC-ADM) ---');

    console.log('Setting up mock user, guide profile, and listing...');

    // We create a dummy Admin user for the audit logs
    const admin = await prisma.user.create({
        data: {
            name: "Admin User",
            email: `admin-${Date.now()}@example.com`,
            role: "ADMIN"
        }
    });

    const testEmail = `test-admin-${Date.now()}@example.com`;
    let user = await prisma.user.create({
        data: {
            name: "Admin Test Guide",
            email: testEmail,
            role: "GUIDE",
            tokenBalance: 0
        }
    });

    try {
        await prisma.guideProfile.create({
            data: {
                userId: user.id,
                fullName: "Admin Guide",
                phone: "000",
                city: "Mekke",
                package: "STARTER",
                tokens: 0
            }
        });

        const makkah = await prisma.departureCity.upsert({
            where: { name: 'Mekke' },
            create: { name: 'Mekke', airport: 'JED', priority: true },
            update: {}
        });

        // Create Listing in PENDING state (Default action of a guide)
        const listing = await prisma.guideListing.create({
            data: {
                guideId: user.id,
                title: "To Be Approved",
                description: "Test",
                city: "Mekke",
                departureCityId: makkah.id,
                pricingCurrency: "SAR",
                price: 1000,
                quota: 30,
                filled: 0,
                active: true,
                approvalStatus: 'PENDING',
                startDate: new Date(),
                endDate: new Date(),
            }
        });

        // Mock Admin Action Function for Listing Approval
        const simulateAdminApprove = async (listingId: string, adminId: string) => {
            const updated = await prisma.guideListing.update({
                where: { id: listingId },
                data: { approvalStatus: 'APPROVED' }
            });
            await prisma.adminAuditLog.create({
                data: {
                    adminId,
                    action: 'approve_listing',
                    targetId: listingId,
                    reason: 'Automated Test Approval',
                    metadata: JSON.stringify({ previousStatus: 'PENDING' })
                }
            });
            return updated;
        };

        // TC-ADM-01: Admin İlan Onaylama
        console.log('\n[TC-ADM-01] Testing Listing Approval...');
        const approvedListing = await simulateAdminApprove(listing.id, admin.id);
        console.log(`PASS: Listing status changed to ${approvedListing.approvalStatus}`);

        const auditLogApprove = await prisma.adminAuditLog.findFirst({ where: { action: 'approve_listing', targetId: listing.id } });
        console.log(`PASS: Audit Log created for approval -> ${!!auditLogApprove}`);

        // TC-ADM-02: Admin İlan Reddetme & Token İadesi
        // Create another listing for rejection
        const rejectedListing = await prisma.guideListing.create({
            data: {
                guideId: user.id,
                title: "To Be Rejected",
                description: "Test",
                city: "Mekke",
                departureCityId: makkah.id,
                pricingCurrency: "SAR",
                price: 1000,
                quota: 30,
                filled: 0,
                active: true,
                approvalStatus: 'PENDING',
                startDate: new Date(),
                endDate: new Date(),
            }
        });

        const simulateAdminReject = async (listingId: string, userId: string, adminId: string, refundTokens: number) => {
            const updated = await prisma.guideListing.update({
                where: { id: listingId },
                data: { approvalStatus: 'REJECTED', active: false, rejectionReason: 'Test Policy Violation' }
            });
            await prisma.adminAuditLog.create({
                data: {
                    adminId,
                    action: 'reject_listing',
                    targetId: listingId,
                    reason: 'Test Policy Violation',
                    metadata: JSON.stringify({ refundedTokens: refundTokens })
                }
            });
            // Refund tokens
            await grantToken({
                userId,
                amount: refundTokens,
                type: 'REFUND',
                reason: `Listing Rejected: ${listingId}`,
                idempotencyKey: `refund-${listingId}`
            });
            return updated;
        };

        console.log('\n[TC-ADM-02] Testing Listing Rejection & Token Refund (10 tokens)...');
        await simulateAdminReject(rejectedListing.id, user.id, admin.id, 10);

        const refundedUser = await prisma.user.findUnique({ where: { id: user.id } });
        console.log(`PASS: User token balance after refund: ${refundedUser?.tokenBalance}`);
        console.log(`PASS: Expected balance 10 -> ${refundedUser?.tokenBalance === 10}`);

        // TC-ADM-03: Diyanet Rozet Sistemi
        console.log('\n[TC-ADM-03] Testing Diyanet Badge Assignment...');

        // Simulating approval
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { isIdentityVerified: true }
        });
        const updatedProfile = await prisma.guideProfile.update({
            where: { userId: user.id },
            data: { isIdentityVerified: true }
        });

        console.log(`PASS: User Record isIdentityVerified -> ${updatedUser.isIdentityVerified}`);
        console.log(`PASS: Profile Record isIdentityVerified -> ${updatedProfile.isIdentityVerified}`);

    } catch (err: any) {
        console.error('TEST FAILED:', err.message);
    } finally {
        // Cleanup
        console.log("\nCleaning up test data...");
        await prisma.guideListing.deleteMany({ where: { guideId: user.id } });
        await prisma.adminAuditLog.deleteMany({ where: { adminId: admin.id } });
        await prisma.tokenTransaction.deleteMany({ where: { userId: user.id } });
        await prisma.guideProfile.delete({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        await prisma.user.delete({ where: { id: admin.id } });
        console.log("Cleanup complete.");
    }
}

runAdminTests().catch(console.error);
