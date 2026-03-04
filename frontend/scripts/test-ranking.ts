import { scoreListing, rankListings, type RankingListingInput, type RankingGuideInput, type RankingBoostInput } from '../src/modules/ranking/ranking-engine';

async function runTests() {
    console.log('--- TEST: RATING & RANKING ENGINE ---');

    const baseListing: RankingListingInput = {
        id: 'list-1',
        type: 'GUIDE_PROFILE',
        createdAt: new Date(),
        updatedAt: new Date(),
        filled: 0,
        quota: 30,
        price: 1500,
        city: 'Mecca'
    };

    const baseGuide: RankingGuideInput = {
        userId: 'guide-1',
        packageType: 'PRO',
        isIdentityVerified: true,
        trustScore: 80,
        completedTrips: 10,
        profileCompleteness: 100,
        avgResponseHours: 2,
        recentActivityCount: 15,
        avgReviewRating: 4.8,
        reviewCount: 20,
        accountAgeDays: 100,
        totalListingsCreated: 5
    };

    const baseBoost: RankingBoostInput = {
        isActive: false,
        effectivePower: 0,
        activeBoostCount: 0
    };

    // TC-RNK-01: Organik Sıralama
    const organicResult = scoreListing(baseListing, baseGuide, baseBoost, null, null);
    console.log('[TC-RNK-01] Organic Score:', organicResult.finalScore, '| Trust Score:', organicResult.trustScore);

    // TC-RNK-02: Öne Çıkarma (Spotlight)
    const boostedBoost = { isActive: true, effectivePower: 1.0, activeBoostCount: 1, boostTier: 'PREMIUM' as const };
    const boostedResult = scoreListing(
        { ...baseListing, id: 'list-2' },
        baseGuide,
        boostedBoost,
        null, null
    );
    console.log('[TC-RNK-02] Boosted Score:', boostedResult.finalScore, '(Organic was:', organicResult.finalScore, ')');

    // Yüzdelik cap limiti kontrolü (Boosted - Organic <= Organic * 0.20)
    const diff = Math.round(boostedResult.finalScore - organicResult.finalScore);
    const maxBoost = Math.round(organicResult.finalScore * 0.18); // cap is 0.18 now
    console.log(`Boost Delta: ${diff}, Max Allowed Boost: ${maxBoost} ->`, diff <= maxBoost ? 'PASS' : 'FAIL');

    // TC-RNK-03: Öne Çıkarma Süresi Bitmiş (isActive: false)
    const expiredBoostResult = scoreListing(
        { ...baseListing, id: 'list-3' },
        baseGuide,
        { ...boostedBoost, isActive: false },
        null, null
    );
    console.log('[TC-RNK-03] Expired Boost Score:', expiredBoostResult.finalScore, '->',
        expiredBoostResult.finalScore === organicResult.finalScore ? 'PASS' : 'FAIL'
    );

    // Rank 3 listings
    const ranked = rankListings([organicResult, boostedResult, expiredBoostResult]);
    console.log('\n--- FINAL RANKING ---');
    ranked.forEach(r => console.log(`#${r.position} - ${r.listingId} (Score: ${r.finalScore})`));
}

runTests().catch(console.error);
