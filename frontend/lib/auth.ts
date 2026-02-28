import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import Facebook from "next-auth/providers/facebook"
import Nodemailer from "next-auth/providers/nodemailer"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import { AuthRateLimit } from "./auth-rate-limit"

// Extend session type
declare module "next-auth" {
    interface Session {
        user: {
            id?: string;
            role?: string;
            requires_onboarding?: boolean;
            wp_user_id?: number | string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string;
        requires_onboarding?: boolean;
        wp_user_id?: number | string;
    }
}

if (!process.env.AUTH_SECRET) {
    console.warn("AUTH_SECRET is not defined. Generating a fallback secret for development.");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    useSecureCookies: process.env.NODE_ENV === "production",
    trustHost: true,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        Google,
        Apple,
        Facebook,
        Nodemailer({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
            async sendVerificationRequest({ identifier: email, url }) {
                if (process.env.NODE_ENV === "development") {
                    console.log("----------------------------------------------")
                    console.log(`Login Link for ${email}:`)
                    console.log(url)
                    console.log("----------------------------------------------")

                    try {
                        const fs = require('fs');
                        const path = require('path');
                        const dataDir = path.join(process.cwd(), "data");
                        if (!fs.existsSync(dataDir)) {
                            fs.mkdirSync(dataDir, { recursive: true });
                        }
                        const filePath = path.join(dataDir, "dev-login.json");
                        fs.writeFileSync(filePath, JSON.stringify({ email, url, timestamp: new Date().toISOString() }));
                    } catch (error) {
                        console.error("Failed to save dev login link:", error);
                    }
                }
            },
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                // Determine IP address securely
                // Use type 'any' for req to bypass NextAuth strict type definitions if headers is missing on its type
                const request = req as any;
                const ip = request?.headers?.get?.("x-forwarded-for") ?? "unknown";
                const email = credentials?.email as string;

                // 1. Bruteforce Hard Check
                const lockout = AuthRateLimit.checkLockout(ip, email);
                if (!lockout.allowed) {
                    throw new Error("Invalid credentials"); // Generic error, no leakage
                }

                if (!email || !credentials?.password) {
                    AuthRateLimit.recordFailure(ip, email);
                    return null;
                }

                const bcrypt = await import("bcryptjs");

                const user = await prisma.user.findUnique({
                    where: { email }
                });

                if (!user || !user.passwordHash) {
                    AuthRateLimit.recordFailure(ip, email);
                    throw new Error("Invalid credentials");
                }

                const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);

                if (!isValid) {
                    AuthRateLimit.recordFailure(ip, email);
                    throw new Error("Invalid credentials");
                }

                // 2. Clear failures on success
                AuthRateLimit.recordSuccess(ip, email);

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role,
                    requires_onboarding: !user.role
                };
            }
        })
    ],
})
