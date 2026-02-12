
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { email, code } = await req.json();

        if (!email || !code) {
            return NextResponse.json(
                { error: "E-posta ve kod gereklidir" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            );
        }

        // Check if already verified
        if (user.isVerified) {
            return NextResponse.json({ success: true, message: "Zaten doğrulanmış" });
        }

        // Check code
        if (user.verificationCode !== code) {
            return NextResponse.json(
                { error: "Geçersiz doğrulama kodu" },
                { status: 400 }
            );
        }

        // Check expiry
        if (user.verificationExpiry && new Date() > new Date(user.verificationExpiry)) {
            return NextResponse.json(
                { error: "Kodun süresi dolmuş. Lütfen tekrar kayıt olun veya yeni kod isteyin." },
                { status: 400 }
            );
        }

        // Mark as verified
        await prisma.user.update({
            where: { email },
            data: {
                isVerified: true,
                verificationCode: null,
                verificationExpiry: null
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json(
            { error: "Doğrulama sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}
