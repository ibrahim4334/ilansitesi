/**
 * Credit System Concurrency Test
 *
 * Verifies that 5 parallel deductCredits() calls against a balance of 10 credits
 * (each costing 5) result in exactly 2 successes and 3 failures, and that the
 * final balance is never negative.
 *
 * This test exercises the row-level lock + SERIALIZABLE isolation used in TokenService.
 *
 * Run with: npx jest lib/__tests__/credit-concurrency.test.ts
 *
 * NOTE: Requires a real database connection (uses actual Prisma transactions).
 * Add `@group integration` if you want to exclude from unit-only CI runs.
 */

import { prisma } from "@/lib/prisma";
import { TokenService } from "@/lib/token-service";

// ─── Test Helpers ──────────────────────────────────────────────────────────

async function createTestUser(id: string) {
    // Upsert a test user
    await prisma.user.upsert({
        where: { id },
        update: {},
        create: {
            id,
            email: `test-concurrency-${id}@test.internal`,
            name: "Concurrency Test User",
            role: "GUIDE",
        }
    });

    // Seed initial balance of 10 credits via ledger
    await prisma.creditTransaction.create({
        data: {
            userId: id,
            amount: 10,
            type: "admin",
            reason: "Test seed balance",
            idempotencyKey: `seed:${id}`,
        }
    });

    // Sync GuideProfile cache
    await prisma.guideProfile.upsert({
        where: { userId: id },
        update: { credits: 10 },
        create: {
            userId: id,
            fullName: "Concurrency Test",
            phone: "",
            city: "",
            credits: 10,
            package: "FREEMIUM",
            tokens: 0
        }
    });
}

async function cleanupTestUser(id: string) {
    await prisma.creditTransaction.deleteMany({ where: { userId: id } });
    await prisma.guideProfile.deleteMany({ where: { userId: id } });
    await prisma.user.deleteMany({ where: { id } });
}

// ─── Concurrency Test ─────────────────────────────────────────────────────

describe("Credit concurrency: parallel deductions", () => {
    const TEST_USER_ID = "concurrency-test-user-abc123";
    const COST = 5;
    const PARALLEL_COUNT = 5;

    beforeAll(async () => {
        await cleanupTestUser(TEST_USER_ID); // Clean slate
        await createTestUser(TEST_USER_ID);
    });

    afterAll(async () => {
        await cleanupTestUser(TEST_USER_ID);
        await prisma.$disconnect();
    });

    it("should allow at most floor(10/5)=2 concurrent deductions to succeed", async () => {
        // Fire 5 parallel deductions simultaneously
        const results = await Promise.allSettled(
            Array.from({ length: PARALLEL_COUNT }, (_, i) =>
                TokenService.deductCredits(
                    TEST_USER_ID,
                    COST,
                    `Parallel test deduction ${i + 1}`,
                    `test-ref-${i}`,
                    `concurrent-test:${TEST_USER_ID}:${i}` // unique idempotency key per request
                )
            )
        );

        const successes = results
            .filter(r => r.status === "fulfilled" && (r.value as any).success === true)
            .map(r => (r as PromiseFulfilledResult<any>).value);

        const failures = results
            .filter(r => r.status === "fulfilled" && (r.value as any).success === false)
            .map(r => (r as PromiseFulfilledResult<any>).value);

        const errors = results.filter(r => r.status === "rejected");

        console.log(`Successes: ${successes.length}, Failures: ${failures.length}, Errors: ${errors.length}`);

        // ── Core assertions ──

        // Exactly 2 should succeed (10 / 5 = 2)
        expect(successes.length).toBe(2);

        // Remaining 3 should be refused (insufficient credits)
        expect(failures.length).toBe(3);

        // No uncaught errors (race should be handled gracefully)
        expect(errors.length).toBe(0);

        // Final ledger balance must be exactly 0 (not negative)
        const finalBalance = await TokenService.getBalance(TEST_USER_ID);
        expect(finalBalance).toBe(0);
        expect(finalBalance).toBeGreaterThanOrEqual(0);

        // Failed responses should report correct balance (not stale)
        for (const failure of failures) {
            expect(failure.newBalance).toBeGreaterThanOrEqual(0);
        }
    });

    it("should not allow negative balance under any parallel scenario", async () => {
        // Reset user with only 5 credits (enough for 1 more deduction)
        await prisma.creditTransaction.create({
            data: {
                userId: TEST_USER_ID,
                amount: 5,
                type: "admin",
                reason: "Second test seed",
            }
        });
        await prisma.guideProfile.update({
            where: { userId: TEST_USER_ID },
            data: { credits: 5 }
        });

        // 10 simultaneous requests each wanting 5 credits
        const results = await Promise.allSettled(
            Array.from({ length: 10 }, (_, i) =>
                TokenService.deductCredits(
                    TEST_USER_ID,
                    5,
                    `Negative guard test ${i}`,
                    `test-neg-${i}`,
                    `negative-guard:${TEST_USER_ID}:${i}`
                )
            )
        );

        const finalBalance = await TokenService.getBalance(TEST_USER_ID);

        // Balance must never go negative
        expect(finalBalance).toBeGreaterThanOrEqual(0);

        // At most 1 can succeed
        const successes = results.filter(
            r => r.status === "fulfilled" && (r as PromiseFulfilledResult<any>).value.success === true
        );
        expect(successes.length).toBeLessThanOrEqual(1);
    });

    it("should be idempotent: repeating same idempotencyKey should not double-charge", async () => {
        const balanceBefore = await TokenService.getBalance(TEST_USER_ID);
        const IDEM_KEY = `idem-test:${TEST_USER_ID}:recharge-1`;

        // Add 5 credits to have room
        await prisma.creditTransaction.create({
            data: { userId: TEST_USER_ID, amount: 5, type: "admin", reason: "Idempotency test seed" }
        });
        await prisma.guideProfile.update({ where: { userId: TEST_USER_ID }, data: { credits: { increment: 5 } } });

        const first = await TokenService.deductCredits(TEST_USER_ID, 5, "Idempotency deduction", undefined, IDEM_KEY);
        const second = await TokenService.deductCredits(TEST_USER_ID, 5, "Idempotency deduction (retry)", undefined, IDEM_KEY);
        const third = await TokenService.deductCredits(TEST_USER_ID, 5, "Idempotency deduction (retry 2)", undefined, IDEM_KEY);

        expect(first.success).toBe(true);
        expect(second.idempotent).toBe(true); // Recognized as repeat
        expect(third.idempotent).toBe(true);  // Recognized as repeat

        // Only ONE deduction should have occurred
        const balanceAfter = await TokenService.getBalance(TEST_USER_ID);
        expect(balanceBefore - balanceAfter).toBeLessThanOrEqual(5); // Lost at most 5 credits
    });
});
