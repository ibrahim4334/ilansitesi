import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { token, email, newPassword } = await req.json();

        if (!token || !email || !newPassword) {
            return NextResponse.json({ error: "Eksik bilgi." }, { status: 400 });
        }

        // Verify token
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                identifier: email,
                token: token,
                expires: { gt: new Date() }
            }
        });

        if (!verificationToken) {
            return NextResponse.json({ error: "Geçersiz veya süresi dolmuş bağlantı." }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user
        await prisma.user.update({
            where: { email },
            data: { passwordHash: hashedPassword }
        });

        // Delete used token
        await prisma.verificationToken.delete({
            where: { token }
        });

        return NextResponse.json({ success: true, message: "Şifre güncellendi." });

    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
    }
}
