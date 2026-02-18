import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user, account, trigger, session }) {
            // Handle client-side updates (e.g. update({ role: ... }))
            if (trigger === "update" && session) {
                // Only apply known safe fields — never blindly spread
                if (session.role) {
                    token.role = session.role;
                }
                if (typeof session.requires_onboarding === "boolean") {
                    token.requires_onboarding = session.requires_onboarding;
                }
            }

            // On sign-in: read role from the user object (set by authorize() or adapter)
            if (user) {
                token.role = (user as any).role || null;
                token.requires_onboarding = !token.role;
            }

            // If token still has no role, try to read from DB (handles token refresh)
            if (!token.role && token.email) {
                try {
                    const { prisma } = await import("@/lib/prisma");
                    const dbUser = await prisma.user.findUnique({
                        where: { email: token.email as string },
                        select: { role: true }
                    });
                    if (dbUser?.role) {
                        token.role = dbUser.role;
                        token.requires_onboarding = false;
                    }
                } catch (e) {
                    console.error("DB role lookup failed:", e);
                }
            }

            if (!token.role) token.requires_onboarding = true;
            if (token.role === "BANNED") token.requires_onboarding = false;

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                const role = (token.role as string) || null;
                session.user.role = role || undefined;
                session.user.requires_onboarding = !role;
                if (token.sub) {
                    (session.user as any).id = token.sub;
                }
            }
            return session;
        },
        authorized() {
            // Let middleware.ts handle all redirect logic
            return true;
        },
        async redirect({ url, baseUrl }) {
            return url.startsWith(baseUrl) ? url : baseUrl;
        }
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig
