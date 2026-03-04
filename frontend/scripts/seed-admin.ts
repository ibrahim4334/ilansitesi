import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = "admin@umrebuldum.com";
    const password = "123Ert123";
    const role = "ADMIN";

    console.log(`Checking if admin ${email} exists...`);

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        console.log(`User ${email} already exists. Updating role to ADMIN and resetting password...`);
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { email },
            data: {
                role: role as any,
                passwordHash: hashedPassword,
                isVerified: true
            }
        });
        console.log("Admin account updated successfully!");
    } else {
        console.log(`Creating new admin account ${email}...`);
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                name: "Admin",
                email: email,
                passwordHash: hashedPassword,
                role: role as any,
                isVerified: true,
                image: `https://ui-avatars.com/api/?name=Admin&background=random`
            }
        });
        console.log("Admin account created successfully!");
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("Error creating admin:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
