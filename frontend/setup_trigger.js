const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Dropping old trigger if exists...");
        await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_update_token_balance;`);

        console.log("Creating new trigger...");
        await prisma.$executeRawUnsafe(`
      CREATE TRIGGER trg_update_token_balance
      AFTER INSERT ON token_ledger_entries
      FOR EACH ROW 
      BEGIN
          IF NEW.entryType IN ('PURCHASE', 'REFUND', 'ADJUSTMENT') THEN
              UPDATE User 
              SET availableBalance = availableBalance + NEW.amount,
                  updatedAt = NOW()
              WHERE id = NEW.userId;
          END IF;
      END;
    `);

        console.log("Trigger created successfully.");
    } catch (e) {
        console.error("Error creating trigger:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
