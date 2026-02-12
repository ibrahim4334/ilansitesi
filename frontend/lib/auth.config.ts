import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user, account, trigger, session }) {
            // Handle client-side updates (e.g. update({ role: ... }))
            if (trigger === "update" && session) {
                // Merge session updates into token
                token = { ...token, ...session };
            }

            // Default role to null if missing
            if (!token.role) token.role = null;

            // Logic: On sign in (when user object is present), sync with WP
            if (user) {
                try {
                    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost/umre/kurulum/umrebuldum';

                    const payload = {
                        email: user.email,
                        name: user.name,
                        provider: account?.provider,
                    };

                    // Note: fetch is available in Edge Runtime
                    const res = await fetch(`${wpUrl}/wp-json/umrebuldum/v1/auth`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        console.log("WP Auth Data:", data); // Debug log

                        if (data.success) {
                            token.wp_user_id = data.user_id;
                            // Only overwrite if WP has a role, otherwise keep local role (e.g. from registration)
                            if (data.role) {
                                token.role = data.role;
                            }

                            // Fix: Check code for onboarding requirement
                            if (data.code === 'requires_onboarding') {
                                token.requires_onboarding = true;
                            } else {
                                token.requires_onboarding = false;
                            }
                        }
                    } else {
                        console.error("WP Sync Response Not OK:", res.status);
                    }
                } catch (e) {
                    console.error("WP Sync Failed:", e);
                }
            }
            return token;
        },
        async session({ session, token }) {
            // Safe session construction
            if (session.user) {
                // Persistent Role Logic
                const role = (token.role as string) || null;
                session.user.role = role || undefined;

                // Onboarding Logic: True if explicit flag is true OR if Role is missing
                const explicitFlag = (token.requires_onboarding as boolean);
                session.user.requires_onboarding = explicitFlag === true || !role;

                session.user.wp_user_id = (token.wp_user_id as number | string) ?? null;
                // Ensure ID is set
                // session.user.id = token.sub ?? session.user.id; 
            }
            return session;
        },
        authorized({ auth, request: nextUrl }) {
            // Middleware logic can go here or remain in middleware.ts using auth() wrapper
            // For now we just return true to let middleware handle redirection logic manually
            // or implement specific checks here.
            // Returning true means "allow access", false means "redirect to login"
            return true;
        },
        async redirect({ url, baseUrl }) {
            return url.startsWith(baseUrl) ? url : baseUrl;
        }
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig
