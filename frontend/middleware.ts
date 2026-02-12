import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const { nextUrl } = req
    const user = req.auth?.user

    // Paths
    const dashboardPath = "/dashboard"
    const onboardingPath = "/onboarding"
    const loginPath = "/login"
    const rootPath = "/"

    const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
    const isPublicRoute = ["/", "/login", "/register", "/about", "/contact", "/faq", "/terms", "/privacy", "/help", "/api/dev-login-link"].includes(nextUrl.pathname);
    const isAuthRoute = [loginPath].includes(nextUrl.pathname);
    const isOnboardingRoute = nextUrl.pathname === onboardingPath;

    // 1. API Auth routes always allowed
    if (isApiAuthRoute) {
        return null;
    }

    // 2. Logic for Logged In Users
    if (isLoggedIn) {
        const hasRole = !!user?.role;
        const requiresOnboarding = user?.requires_onboarding || !hasRole;

        // SCENARIO A: User Needs Onboarding (No role or explicitly flagged)
        if (requiresOnboarding) {
            // Allow access to onboarding
            if (isOnboardingRoute) {
                return null;
            }
            // Allow API calls and static assets
            if (nextUrl.pathname.startsWith("/api") || nextUrl.pathname.startsWith("/_next") || nextUrl.pathname.includes(".")) {
                return null;
            }
            // Redirect EVERYTHING else to onboarding
            return NextResponse.redirect(new URL(onboardingPath, nextUrl));
        }

        // SCENARIO B: User Has Role (Fully Onboarded)
        if (!requiresOnboarding) {
            const role = user?.role;

            // Block Onboarding page -> Redirect based on role
            if (isOnboardingRoute) {
                if (role === "GUIDE") return NextResponse.redirect(new URL("/guide/dashboard", nextUrl)); // Assuming dashboard path
                if (role === "ORGANIZATION") return NextResponse.redirect(new URL("/org/dashboard", nextUrl));
                return NextResponse.redirect(new URL(rootPath, nextUrl));
            }

            // Block Login page -> Redirect based on role
            if (isAuthRoute) {
                if (role === "GUIDE") return NextResponse.redirect(new URL("/guide/dashboard", nextUrl));
                if (role === "ORGANIZATION") return NextResponse.redirect(new URL("/org/dashboard", nextUrl));
                return NextResponse.redirect(new URL(dashboardPath, nextUrl));
            }

            // ROLE PROTECTION RULES
            // 0. /admin/* is ONLY for ADMIN
            if (nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
                return NextResponse.redirect(new URL(rootPath, nextUrl));
            }
            // 1. /guide/* is ONLY for GUIDE
            if (nextUrl.pathname.startsWith("/guide") && role !== "GUIDE") {
                return NextResponse.redirect(new URL(rootPath, nextUrl));
            }
            // 2. /org/* is ONLY for ORGANIZATION
            if (nextUrl.pathname.startsWith("/org") && role !== "ORGANIZATION") {
                return NextResponse.redirect(new URL(rootPath, nextUrl));
            }

            // 3. /request is ONLY for USER
            if (nextUrl.pathname.startsWith("/request") && role !== "USER") {
                // If a guide tries to go to /request, maybe show them the dashboard?
                // For now, redirect home or dashboard.
                return NextResponse.redirect(new URL(rootPath, nextUrl));
            }

            // 4. /dashboard/requests is for GUIDE or ORGANIZATION
            if (nextUrl.pathname.startsWith("/dashboard/requests")) {
                if (role !== "GUIDE" && role !== "ORGANIZATION") {
                    return NextResponse.redirect(new URL(rootPath, nextUrl));
                }
            }
        }
    }

    // 3. Logic for Guests (Not Logged In)
    else {
        // Allow public routes
        if (isPublicRoute) {
            return null;
        }
        // Redirect protected routes to login
        return NextResponse.redirect(new URL(loginPath, nextUrl));
    }

    return null;
})

// Optionally, don't invoke Middleware on some paths
export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
