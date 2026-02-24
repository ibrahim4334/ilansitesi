// ─── Safe Error Response ────────────────────────────────────────────────
// Strips Prisma/Stripe internals from API error responses.
// Use in catch blocks to prevent information leakage.

const SAFE_MESSAGES = new Set([
    "INSUFFICIENT_CREDITS",
    "PACKAGE_NOT_FOUND",
    "USER_NOT_FOUND",
    "Invalid metadata",
    "Missing userId",
    "Missing targetUserId",
    "Missing requestId",
    "Missing fields",
    "Missing threadId",
    "Missing messageId",
    "Invalid role",
    "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
    "File too large. Maximum size is 5 MB.",
    "Already expressed interest",
    "Request is closed",
    "User not found",
    "Rate limit exceeded",
    "Account banned",
    "Unauthorized",
    "Forbidden",
    "Request not found",
    "Thread not found",
    "Message not found",
    "Already deleted",
    "Listing limit reached",
    "Daily interest limit reached",
]);

/**
 * Returns a safe error message for API responses.
 * Known application errors pass through; unknown/internal errors are masked.
 */
export function safeErrorMessage(error: any, fallback = "Internal Server Error"): string {
    const msg = error?.message || String(error);
    if (SAFE_MESSAGES.has(msg)) return msg;

    // Log the full error server-side for debugging
    console.error("[API Error - masked]", error);
    return fallback;
}

/**
 * Build a safe NextResponse JSON error.
 * Usage: return safeErrorJson(err, 500);
 */
export function safeErrorJson(error: any, status = 500, fallback?: string) {
    const { NextResponse } = require("next/server");
    return NextResponse.json(
        { error: safeErrorMessage(error, fallback) },
        { status }
    );
}
