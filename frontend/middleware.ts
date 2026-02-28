import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const { nextUrl } = req
    const user = req.auth?.user

    // ── Path constants ──
    const onboardingPath = "/onboarding"
    const loginPath = "/login"

    const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
    const isApiRoute = nextUrl.pathname.startsWith("/api");
    const isStaticAsset = nextUrl.pathname.startsWith("/_next") || nextUrl.pathname.includes(".");

    const publicRoutes = [
        "/", "/login", "/register", "/about", "/contact", "/faq",
        "/terms", "/privacy", "/help", "/kvkk", "/cookies",
        "/listing-terms", "/refund-policy", "/consent",
        "/auth/verify"
    ];
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
    const isPublicBrowsing = nextUrl.pathname.startsWith("/tours") || nextUrl.pathname.startsWith("/listings/");
    const isAuthRoute = nextUrl.pathname === loginPath;
    const isOnboardingRoute = nextUrl.pathname === onboardingPath;

    // 1. Always allow: API auth, other API, static assets
    if (isApiAuthRoute || isApiRoute || isStaticAsset) {
        return null;
    }

    // 2. Logged-in users
    if (isLoggedIn) {
        const hasRole = !!user?.role;
        const isBanned = user?.role === "BANNED";

        // ── SCENARIO: BANNED user ──
        if (isBanned) {
            if (isPublicRoute || isPublicBrowsing) return null;
            return NextResponse.redirect(new URL("/", nextUrl));
        }

        // ── SCENARIO A: Needs onboarding (no role) ──
        const requiresOnboarding = !hasRole;
        if (requiresOnboarding) {
            if (isOnboardingRoute) return null;
            if (isPublicRoute || isPublicBrowsing) return null;
            return NextResponse.redirect(new URL(onboardingPath, nextUrl));
        }

        // ── SCENARIO B: Has role (fully onboarded) ──
        const role = user?.role;

        // Block onboarding page → go to correct dashboard
        if (isOnboardingRoute) {
            if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
            return NextResponse.redirect(new URL("/dashboard", nextUrl));
        }

        // Block login page → go to correct dashboard
        if (isAuthRoute) {
            if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
            return NextResponse.redirect(new URL("/dashboard", nextUrl));
        }

        // ── Role protection ──
        // /admin/* → ADMIN only
        if (nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", nextUrl));
        }

        // /dashboard/* → USER, GUIDE, ORGANIZATION (not ADMIN — admin has /admin/*)
        if (nextUrl.pathname.startsWith("/dashboard") && role === "ADMIN") {
            return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
        }

        // /guide/* → GUIDE or ORGANIZATION only
        if (nextUrl.pathname.startsWith("/guide") && role !== "GUIDE" && role !== "ORGANIZATION") {
            return NextResponse.redirect(new URL("/dashboard", nextUrl));
        }

        // /org/* → ORGANIZATION only
        if (nextUrl.pathname.startsWith("/org") && role !== "ORGANIZATION") {
            return NextResponse.redirect(new URL("/dashboard", nextUrl));
        }
    }

    // 3. Guest (not logged in)
    else {
        if (isPublicRoute || isPublicBrowsing) {
            return null;
        }
        return NextResponse.redirect(new URL(loginPath, nextUrl));
    }

    return null;
})

export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)"],
}
