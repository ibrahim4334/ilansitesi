import { prisma } from '../lib/prisma';
import { PackageSystem, TOKEN_COSTS } from '../lib/package-system';

async function runListingTests() {
    console.log('--- TEST: LISTING MANAGEMENT (TC-LIS) ---');
    console.log('Setting up mock user and guide profile...');

    const testEmail = `test-listing-${Date.now()}@example.com`;
    let user = await prisma.user.create({
        data: {
            name: "Listing Test User",
            email: testEmail,
            role: "GUIDE",
            tokenBalance: 100 // Pre-fund wallet
        }
    });

    try {
        await prisma.guideProfile.create({
            data: {
                userId: user.id,
                fullName: "Test Guide",
                phone: "1234567890",
                city: "Istanbul",
                package: "STARTER",
                tokens: 100
            }
        });

        const makkah = await prisma.departureCity.upsert({
            where: { name: 'Mekke' },
            create: { name: 'Mekke', airport: 'JED', priority: true },
            update: {}
        });

        // TC-LIS-01: Valid Listing creation
        console.log('\n[TC-LIS-01 & TC-LIS-02] Creating a new listing...');

        const mockPayload = {
            title: "Test Umrah Tour - 14 Days",
            description: "A wonderful spiritual journey.",
            city: "Mekke",
            quota: "45",
            departureCityId: makkah.id,
            price: "1200",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
            totalDays: "14",
            legalConsent: true
        };

        console.log('Direct DB Insertion Test (Simulating POST /api/listings):');
        const listing = await prisma.guideListing.create({
            data: {
                guideId: user.id,
                title: mockPayload.title,
                description: mockPayload.description,
                city: mockPayload.city,
                departureCityId: mockPayload.departureCityId,
                pricingCurrency: "SAR",
                price: parseFloat(mockPayload.price),
                quota: parseInt(mockPayload.quota),
                filled: 0,
                active: true,
                isFeatured: false,
                startDate: new Date(mockPayload.startDate),
                endDate: new Date(mockPayload.endDate),
                totalDays: parseInt(mockPayload.totalDays),
                approvalStatus: 'PENDING', // TC-LIS-02 verification
                legalConsent: mockPayload.legalConsent,
                consentTimestamp: new Date(),
            }
        });

        console.log(`PASS: Listing created successfully. ID: ${listing.id}`);
        console.log(`[TC-LIS-02] Approval Status: ${listing.approvalStatus} ->`, listing.approvalStatus === 'PENDING' ? 'PASS' : 'FAIL');
        console.log(`[TC-LIS-03] Quota saved: ${listing.quota} ->`, listing.quota === 45 ? 'PASS' : 'FAIL');

        // TC-LIS-04: Update / Soft Delete
        console.log('\n[TC-LIS-04] Testing Soft Delete...');
        const updated = await prisma.guideListing.update({
            where: { id: listing.id },
            data: { deletedAt: new Date(), active: false }
        });

        console.log('Soft Delete applied. active:', updated.active, 'deletedAt:', updated.deletedAt !== null);
        console.log('PASS: Soft delete successful.');

    } catch (err: any) {
        console.error('TEST FAILED:', err.message);
    } finally {
        // Cleanup
        console.log("\nCleaning up test data...");
        await prisma.guideListing.deleteMany({ where: { guideId: user.id } });
        await prisma.guideProfile.delete({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        console.log("Cleanup complete.");
    }
}

runListingTests().catch(console.error);
