import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { AuthRateLimit } from "@/lib/auth-rate-limit";

export async function POST(req: Request) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const body = await req.json();
        const { token, email, newPassword } = body;

        const lockout = AuthRateLimit.checkLockout(ip, email);
        if (!lockout.allowed) {
            return NextResponse.json({ error: lockout.reason || "Too many attempts" }, { status: 429 });
        }

        if (!token || !email || !newPassword) {
            AuthRateLimit.recordFailure(ip, email);
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
            AuthRateLimit.recordFailure(ip, email);
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

        AuthRateLimit.recordSuccess(ip, email);

        return NextResponse.json({ success: true, message: "Şifre güncellendi." });

    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
    }
}
