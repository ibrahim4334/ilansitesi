import { prisma } from "@/lib/prisma";
import { LedgerEntryType } from "@prisma/client";

export class TokenService {
    /**
     * Generates a deterministic idempotency key for robust backend double-spend prevention.
     * Removes client-provided UUIDs, shutting down automated retry attacks.
     * @param userId - ID of the user spending tokens
     * @param action - Business context (e.g., BOOST, SPOTLIGHT, OFFER)
     * @param referenceId - Resource ID context (e.g., listingId, leadId)
     */
    static generateIdempotencyKey(userId: string, action: string, referenceId?: string): string {
        const d = new Date();
        const YYYYMMDD = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
        const YYYYMM = YYYYMMDD.substring(0, 6);

        const act = action.toUpperCase();

        if (act.includes("BOOST") || act.includes("FEATURE") || act.includes("SPOTLIGHT")) {
            return `${act}:${userId}:${referenceId || 'global'}:${YYYYMMDD}`;
        }
        if (act === "SEND_OFFER" || act === "UNLOCK_DEMAND" || act === "PURCHASE_LEAD") {
            return `${act}:${userId}:${referenceId || 'global'}`;
        }
        if (act === "RENEWAL" || act === "SUBSCRIPTION_FEE") {
            return `${act}:${userId}:${YYYYMM}`;
        }

        // Fallback for immediate short-term actions
        const HH = String(d.getUTCHours()).padStart(2, '0');
        return `${act}:${userId}:${referenceId || 'global'}:${YYYYMMDD}-${HH}`;
    }

    /**
     * Atomically consumes tokens from a user account utilizing a double-spend safe RAW SQL UPDATE.
     * Prevents negative balance and enforces strict idempotency.
     * 
     * @param userId - ID of the user spending tokens
     * @param cost - Amount of tokens to deduct (must be a positive integer)
     * @param action - Action performing the spend
     * @param referenceId - Context ID (e.g. listingId or action name)
     * @param tx - Optional Prisma transaction client
     * @returns new available balance
     */
    static async consumeTokens(
        userId: string,
        cost: number,
        action: string,
        referenceId: string,
        tx?: any
    ): Promise<{ balance: number; alreadyProcessed: boolean }> {
        if (cost <= 0) throw new Error("Cost must be greater than zero.");

        const idempotencyKey = TokenService.generateIdempotencyKey(userId, action, referenceId);

        const client = tx || prisma;

        // 1. Atomic deduction (implicit lock)
        // Note: Prisma raw queries against MySQL might behave slightly differently than Postgres for RETURNING.
        // MySQL does not support 'RETURNING'. We must split into UPDATE then SELECT inside a transaction if tx is not provided,
        // or rely on isolation levels.

        // Ensure isolation if no transaction is provided
        const executionClient = tx ? async (work: any) => work(tx) : (work: any) => prisma.$transaction(work, { isolationLevel: 'RepeatableRead' });

        return await executionClient(async (txClient: any) => {
            // STEP 0: Check if Ledger Entry Exists (Idempotency Lock)
            const existingEntry = await txClient.$queryRaw`
                SELECT id, amount 
                FROM token_ledger_entries
                WHERE idempotencyKey = ${idempotencyKey}
                LIMIT 1
            `;

            if (Array.isArray(existingEntry) && existingEntry.length > 0) {
                // Duplicate / Retry detected. Safe to ignore deduction.
                const user = await txClient.user.findUnique({
                    where: { id: userId },
                    select: { availableBalance: true }
                });
                return { balance: user.availableBalance, alreadyProcessed: true };
            }

            // A. Execute strict update
            const updateResult = await txClient.$executeRaw`
                UPDATE User
                SET availableBalance = availableBalance - ${cost},
                    updatedAt = NOW()
                WHERE id = ${userId}
                  AND availableBalance >= ${cost}
            `;

            // If affectedRows is 0, the balance was insufficient or user doesn't exist
            if (updateResult === 0) {
                throw new Error("Insufficient tokens or invalid account.");
            }

            // B. Insert Immutable Ledger Entry
            // If idempotencyKey exists, Prisma throws P2002 Unique Constraint violation, rolls back the transaction, restoring balance.
            await txClient.tokenTransaction.create({
                data: {
                    userId,
                    entryType: LedgerEntryType.CONSUME,
                    amount: -cost,
                    referenceId,
                    idempotencyKey,
                }
            });

            // C. Fetch final state to return
            const user = await txClient.user.findUnique({
                where: { id: userId },
                select: { availableBalance: true }
            });

            return { balance: user.availableBalance, alreadyProcessed: false };
        });
    }
}
