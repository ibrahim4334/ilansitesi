import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Seed default credit packages
    const packages = [
        { id: "pkg_starter", name: "Başlangıç Paketi", credits: 10, priceTRY: 299 },
        { id: "pkg_pro", name: "Pro Paket", credits: 30, priceTRY: 799 },
        { id: "pkg_agency", name: "Ajans Paketi", credits: 100, priceTRY: 1999 },
    ];

    for (const pkg of packages) {
        await prisma.creditPackage.upsert({
            where: { id: pkg.id },
            update: {},
            create: pkg,
        });
    }

    console.log("✅ Seeded credit packages");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
