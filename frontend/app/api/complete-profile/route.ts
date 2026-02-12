/**
 * DEPRECATED: This endpoint is no longer in use.
 * Role assignment is now handled exclusively by:
 * - /api/auth/register (on signup)
 * - /api/set-role (ADMIN-only)
 *
 * This file exists only to return 410 Gone if old clients call it.
 */
import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json(
        { error: "Gone. Use /api/auth/register for new accounts." },
        { status: 410 }
    );
}
