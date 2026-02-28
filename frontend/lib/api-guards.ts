import { NextResponse } from "next/server";

// ─── Server-Side API Guards ─────────────────────────────────────────────
// Every guard returns a NextResponse error OR null. 
// If null → guard passed, continue.

type Session = {
    user: {
        email?: string | null;
        role?: string;
        name?: string | null;
    }
} | null;


/**
 * Require authenticated session. Returns 401 if not authenticated.
 * Also rejects BANNED users with 403.
 */
export function requireAuth(session: Session): NextResponse | null {
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role === "BANNED") {
        return NextResponse.json({ error: "Account banned" }, { status: 403 });
    }
    return null;
}

/**
 * Require one of the specified roles. Returns 403 if role doesn't match.
 */
export function requireRole(session: Session, ...roles: string[]): NextResponse | null {
    const authErr = requireAuth(session);
    if (authErr) return authErr;

    if (!session!.user.role || !roles.includes(session!.user.role)) {
        return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
    }
    return null;
}

/**
 * Shortcut: require ADMIN role.
 */
export function requireAdmin(session: Session): NextResponse | null {
    return requireRole(session, "ADMIN");
}

/**
 * Shortcut: require GUIDE or ORGANIZATION role.
 */
export function requireSupply(session: Session): NextResponse | null {
    return requireRole(session, "GUIDE", "ORGANIZATION");
}

// NOTE: requireCredits() has been REMOVED.
// It was a TOCTOU-vulnerable pre-check that read from the legacy credit_transactions table.
// All balance checks are now done atomically INSIDE spendToken() / grantToken() transactions.
