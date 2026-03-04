import { spendToken, grantToken, TokenPolicy } from '../src/modules/tokens';
import { prisma } from '../lib/prisma';

async function runTokenTests() {
    console.log('--- TEST: TOKEN ECONOMY ---');

    const testEmail = `test-token-${Date.now()}@example.com`;
    const user = await prisma.user.create({
        data: {
            name: "Token Test User",
            email: testEmail,
            role: "GUIDE"
        }
    });

    try {
        console.log("User created:", user.id);

        try {
            console.log("\n[TC-ECO-02] Trying to spend without balance...");
            await spendToken({
                userId: user.id,
                action: 'LISTING_CREATE',
                reason: 'test-listing-fail'
            });
            console.log("FAIL: Should have thrown Insufficient balance");
        } catch (error: any) {
            console.log("PASS: Caught error ->", error.message);
        }

        console.log("\nAdding 100 tokens to user's wallet...");
        await grantToken({
            userId: user.id,
            amount: 100,
            type: 'PURCHASE',
            reason: 'TEST_PURCHASE',
            idempotencyKey: 'test-purchase-1'
        });

        console.log("\n[TC-ECO-01 & 03] Spending Token for Listing Create...");
        const receipt = await spendToken({
            userId: user.id,
            action: 'LISTING_CREATE',
            reason: 'test-listing-success'
        });
        console.log("PASS: Token spent successfully. Ok:", receipt.ok);

        const userDb = await prisma.user.findUnique({ where: { id: user.id } });
        const finalBalance = userDb?.tokenBalance || 0;
        const expected = 100 - TokenPolicy.getCost('LISTING_CREATE');
        console.log(`\nFinal Balance: ${finalBalance} (Expected: ${expected})`);
        console.log(finalBalance === expected ? "PASS: Balance matches" : "FAIL: Balance mismatch");
    } finally {
        console.log("\nCleaning up test user data...");
        await prisma.tokenTransaction.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        console.log("Cleanup complete.");
    }
}

runTokenTests().catch(console.error);
