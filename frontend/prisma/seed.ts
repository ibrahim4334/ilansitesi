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

    // ─── Seed Departure Cities ──────────────────────────────────────────────

    const priorityCities = [
        { name: "İstanbul", airport: "İstanbul Havalimanı / Sabiha Gökçen" },
        { name: "Ankara", airport: "Esenboğa" },
        { name: "İzmir", airport: "Adnan Menderes" },
        { name: "Konya", airport: "Konya" },
        { name: "Kayseri", airport: "Erkilet" },
        { name: "Adana", airport: "Çukurova" },
        { name: "Gaziantep", airport: "Gaziantep" },
    ];

    const otherCities = [
        { name: "Antalya", airport: "Antalya" },
        { name: "Trabzon", airport: "Trabzon" },
        { name: "Samsun", airport: "Çarşamba" },
        { name: "Diyarbakır", airport: "Diyarbakır" },
        { name: "Malatya", airport: "Erhaç" },
        { name: "Erzurum", airport: "Erzurum" },
        { name: "Van", airport: "Ferit Melen" },
        { name: "Hatay", airport: "Hatay" },
        { name: "Şanlıurfa", airport: "GAP" },
        { name: "Mardin", airport: "Mardin" },
        { name: "Elazığ", airport: "Elazığ" },
        { name: "Batman", airport: "Batman" },
        { name: "Kahramanmaraş", airport: "Kahramanmaraş" },
    ];

    for (const city of priorityCities) {
        await prisma.departureCity.upsert({
            where: { name: city.name },
            update: { priority: true, airport: city.airport },
            create: { ...city, priority: true },
        });
    }

    for (const city of otherCities) {
        await prisma.departureCity.upsert({
            where: { name: city.name },
            update: { priority: false, airport: city.airport },
            create: { ...city, priority: false },
        });
    }
    console.log("✅ Seeded departure cities");

    // ─── Seed Airlines ──────────────────────────────────────────────────────

    const charterAirlines = [
        "Türk Hava Yolları", "AJet", "SunExpress", "Freebird Airlines", "Tailwind Airlines"
    ];
    const otherAirlines = [
        "Pegasus Airlines", "Corendon Airlines"
    ];

    for (const name of charterAirlines) {
        await prisma.airline.upsert({
            where: { name },
            update: { isCharterFriendly: true },
            create: { name, isCharterFriendly: true },
        });
    }

    for (const name of otherAirlines) {
        await prisma.airline.upsert({
            where: { name },
            update: { isCharterFriendly: false },
            create: { name, isCharterFriendly: false },
        });
    }
    console.log("✅ Seeded airlines");
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
