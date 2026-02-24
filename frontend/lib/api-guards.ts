import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

/**
 * @deprecated TOCTOU RISK — This check is NOT lock-safe:
 *   Two parallel requests can both pass this guard, then both call deductCredits().
 *   Use TokenService.deductCredits() directly instead — it uses SELECT FOR UPDATE
 *   inside a SERIALIZABLE transaction for atomic balance checking.
 *
 * This function remains for backward-compat read-only balance display (e.g. UI hints).
 * NEVER rely on this as a pre-deduction guard.
 */
export async function requireCredits(userId: string, amount: number): Promise<NextResponse | null> {
    const result = await prisma.creditTransaction.aggregate({
        where: { userId },
        _sum: { amount: true }
    });

    const balance = result._sum.amount || 0;

    if (balance < amount) {
        return NextResponse.json(
            { error: "INSUFFICIENT_CREDITS", message: "Yetersiz Kredi", balance },
            { status: 402 }
        );
    }
    return null;
}
