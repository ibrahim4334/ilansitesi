// ─── Role Guard ─────────────────────────────────────────────────────────
// Enforces role-based access at the controller boundary.
// Extracts role check logic from individual route handlers.

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getRoleConfig } from "@/lib/role-config";

export type RoleAction =
    | "canCreateListing"
    | "canSendOffer"
    | "canUnlockDemand"
    | "canBoostListing"
    | "canSpotlight"
    | "canRepublish"
    | "canRefresh"
    | "canPurchaseTokens";

interface GuardResult {
    ok: boolean;
    userId: string;
    email: string;
    role: string;
    error?: NextResponse;
}

/**
 * Check if the current session user has the required role capability.
 * Returns user info if authorized, or a pre-built error response.
 */
export async function requireRole(action: RoleAction): Promise<GuardResult> {
    const session = await auth();

    if (!session?.user?.email) {
        return {
            ok: false,
            userId: "",
            email: "",
            role: "",
            error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }

    const role = session.user.role || "FREEMIUM";
    const config = getRoleConfig(role);

    if (!config[action]) {
        return {
            ok: false,
            userId: session.user.id || "",
            email: session.user.email,
            role,
            error: NextResponse.json({
                error: "Bu işlem için yetkiniz yok",
                requiredAction: action,
                currentRole: role,
            }, { status: 403 }),
        };
    }

    return {
        ok: true,
        userId: session.user.id || "",
        email: session.user.email,
        role,
    };
}

/**
 * Require ADMIN role.
 */
export async function requireAdmin(): Promise<GuardResult> {
    const session = await auth();

    if (!session?.user?.email) {
        return {
            ok: false, userId: "", email: "", role: "",
            error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }

    if (session.user.role !== "ADMIN") {
        return {
            ok: false,
            userId: session.user.id || "",
            email: session.user.email,
            role: session.user.role || "",
            error: NextResponse.json({ error: "Admin only" }, { status: 403 }),
        };
    }

    return {
        ok: true,
        userId: session.user.id || "",
        email: session.user.email,
        role: "ADMIN",
    };
}
