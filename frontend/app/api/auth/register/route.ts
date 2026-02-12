import { NextResponse } from "next/server";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Validation Schema
const registerSchema = z.object({
    name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
    password: z.string()
        .min(8, "Şifre en az 8 karakter olmalıdır")
        .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir")
        .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir")
        .regex(/[0-9]/, "Şifre en az bir rakam içermelidir"),
    role: z.enum(["USER", "GUIDE", "ORGANIZATION"]),
});

export async function POST(req: Request) {
    console.log("Register API Hit");
    try {
        const bodyText = await req.text();
        console.log("Register Body:", bodyText);

        let body;
        try {
            body = JSON.parse(bodyText);
        } catch (e) {
            console.error("JSON parse error:", e);
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            console.error("Validation failed:", JSON.stringify(validation.error.format()));
            return NextResponse.json(
                { error: "Geçersiz veriler", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { name, email, phone, password, role } = validation.data;
        console.log("Valid data for:", email, role);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log("User exists:", email);
            return NextResponse.json(
                { error: "Bu e-posta adresi zaten kullanımda" },
                { status: 409 }
            );
        }

        console.log("Hashing password...");
        let hashedPassword = "";
        try {
            hashedPassword = await bcrypt.hash(password, 10);
            console.log("Password hashed.");
        } catch (hashError) {
            console.error("Bcrypt error:", hashError);
            return NextResponse.json(
                { error: "Şifreleme hatası" },
                { status: 500 }
            );
        }

        // Generate Verification Code (6 digits)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // Create User + Profile + Ledger entry in atomic transaction
        const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    phone,
                    passwordHash: hashedPassword,
                    role,
                    verificationCode,
                    verificationExpiry,
                    isVerified: false,
                    image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
                }
            });

            // If GUIDE or ORGANIZATION, create profile AND write ledger
            if (role === 'GUIDE' || role === 'ORGANIZATION') {
                await tx.guideProfile.create({
                    data: {
                        userId: user.id,
                        fullName: name,
                        phone: phone,
                        city: "İstanbul",
                        quotaTarget: 100,
                        currentCount: 0,
                        isApproved: false,
                        credits: 30,
                        package: "FREEMIUM",
                        tokens: 0
                    }
                });

                // Write initial credits to ledger (source of truth)
                await tx.creditTransaction.create({
                    data: {
                        userId: user.id,
                        amount: 30,
                        type: "admin",
                        reason: "Initial signup credits",
                    }
                });

                console.log(`Created profile for ${role}: ${email} with 30 credits (ledger synced).`);
            }

            return user;
        });

        console.log("User saved.");

        // Simulate Sending Email (Log to console/file in dev)
        console.log("----------------------------------------------");
        console.log(`Verification Code for ${email}: ${verificationCode}`);
        console.log("----------------------------------------------");

        if (process.env.NODE_ENV === "development") {
            try {
                const fs = require('fs');
                const path = require('path');
                const dataDir = path.join(process.cwd(), "data");
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                }
                const filePath = path.join(dataDir, "dev-verify.json");
                fs.writeFileSync(filePath, JSON.stringify({ email, code: verificationCode, timestamp: new Date().toISOString() }));
            } catch (error) {
                console.error("Failed to save dev verify code:", error);
            }
        }

        return NextResponse.json({ success: true, email });

    } catch (error: any) {
        console.error("Registration Critical Error:", error);
        return NextResponse.json(
            {
                error: "Kayıt işlemi sırasında bir hata oluştu",
                debug: error?.message || String(error)
            },
            { status: 500 }
        );
    }
}
