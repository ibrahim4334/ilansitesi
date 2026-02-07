import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import Facebook from "next-auth/providers/facebook"
import Nodemailer from "next-auth/providers/nodemailer"
import { authConfig } from "./auth.config"
import { LocalJSONAdapter } from "./local-adapter"

// Extend session type
declare module "next-auth" {
    interface Session {
        user: {
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
    adapter: LocalJSONAdapter(),
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
    ],
})
