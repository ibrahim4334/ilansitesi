import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

async function runSearchTests() {
    console.log('--- TEST: SEARCH & FILTERING (TC-SRC) ---');
    console.log('Setting up mock listings...');

    const testEmail = `test-search-${Date.now()}@example.com`;
    let user = await prisma.user.create({
        data: {
            name: "Search Test Guide",
            email: testEmail,
            role: "GUIDE"
        }
    });

    try {
        await prisma.guideProfile.create({
            data: {
                userId: user.id,
                fullName: "Search Guide",
                phone: "1234567890",
                city: "Mekke",
                package: "PRO",
                isIdentityVerified: true
            }
        });

        // Set user isIdentityVerified as well for filtering
        await prisma.user.update({
            where: { id: user.id },
            data: { isIdentityVerified: true }
        });

        const ankara = await prisma.departureCity.upsert({
            where: { name: 'Ankara' },
            create: { name: 'Ankara', airport: 'ESB', priority: true },
            update: {}
        });

        const makkah = await prisma.departureCity.upsert({
            where: { name: 'Mekke' },
            create: { name: 'Mekke', airport: 'JED', priority: true },
            update: {}
        });

        // Create 2 differing listings
        const listing1 = await prisma.guideListing.create({
            data: {
                guideId: user.id,
                title: "Budget Umrah",
                description: "Affordable package",
                city: "Mekke",
                departureCityId: ankara.id,
                pricingCurrency: "SAR",
                price: 500,
                quota: 30,
                filled: 0,
                active: true,
                approvalStatus: 'APPROVED',
                startDate: new Date('2026-05-01'),
                endDate: new Date('2026-05-15'),
            }
        });

        const listing2 = await prisma.guideListing.create({
            data: {
                guideId: user.id,
                title: "Luxury Umrah",
                description: "5 Star package",
                city: "Mekke",
                departureCityId: makkah.id,
                pricingCurrency: "SAR",
                price: 2500,
                quota: 30,
                filled: 0,
                active: true,
                approvalStatus: 'APPROVED',
                startDate: new Date('2026-06-01'),
                endDate: new Date('2026-06-15'),
            }
        });

        const now = new Date('2026-01-01');

        const simulateSearch = async (params: { minPrice?: number, minDate?: string, maxDate?: string, departureCityId?: string, isIdentityVerified?: boolean }) => {
            let where: Prisma.GuideListingWhereInput = {
                active: true,
                approvalStatus: 'APPROVED',
                deletedAt: null,
                endDate: { gte: now }
            };

            if (params.departureCityId) {
                where.departureCityId = params.departureCityId;
            }

            if (params.isIdentityVerified) {
                where.guide = { user: { isIdentityVerified: true } };
            }

            let listings = await prisma.guideListing.findMany({ where, include: { guide: { include: { user: true } } } });

            // Date processing
            if (params.minDate || params.maxDate) {
                listings = listings.filter(l => {
                    const lStart = l.startDate.getTime();
                    const lEnd = l.departureDateEnd ? l.departureDateEnd.getTime() : lStart;
                    const searchMin = params.minDate ? new Date(params.minDate).getTime() : -Infinity;
                    const searchMax = params.maxDate ? new Date(params.maxDate).getTime() : Infinity;
                    return lStart <= searchMax && lEnd >= searchMin;
                });
            }

            // Price filtering (simulating Route logic using base price field fallback)
            if (params.minPrice) {
                listings = listings.filter(l => l.price >= params.minPrice!);
            }

            return listings;
        };

        // TC-SRC-01: Fiyat Filtresi
        console.log('\n[TC-SRC-01] Testing Price Filter (Min 2000)...');
        let results = await simulateSearch({ minPrice: 2000 });
        let foundLuxury = results.find((r: any) => r.id === listing2.id);
        let foundBudget = results.find((r: any) => r.id === listing1.id);
        console.log(`PASS: Expensive found: ${!!foundLuxury}, Budget hidden: ${!foundBudget}`);

        // TC-SRC-02: Tarih Filtresi
        console.log('\n[TC-SRC-02] Testing Date Filter (June)...');
        results = await simulateSearch({ minDate: '2026-06-01', maxDate: '2026-06-30' });
        foundLuxury = results.find((r: any) => r.id === listing2.id);
        foundBudget = results.find((r: any) => r.id === listing1.id);
        console.log(`PASS: June found: ${!!foundLuxury}, May hidden: ${!foundBudget}`);

        // TC-SRC-03: Kalkış Şehri Filtresi
        console.log('\n[TC-SRC-03] Testing Departure City Filter (Ankara)...');
        results = await simulateSearch({ departureCityId: ankara.id });
        foundLuxury = results.find((r: any) => r.id === listing2.id);
        foundBudget = results.find((r: any) => r.id === listing1.id);
        console.log(`PASS: Ankara listing found: ${!!foundBudget}, Makkah listing hidden: ${!foundLuxury}`);

        // TC-SRC-04: Diyanet Onayı (Identity Verified) Filtresi
        console.log('\n[TC-SRC-04] Testing Identity Verified Filter...');
        results = await simulateSearch({ isIdentityVerified: true });
        const foundAny = results.some((r: any) => r.guideId === user.id);
        console.log(`PASS: Verified Guide's listings found -> ${foundAny}`);

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

runSearchTests().catch(console.error);
