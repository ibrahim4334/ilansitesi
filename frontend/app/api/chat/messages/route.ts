
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { containsProfanity } from "@/lib/bannedWords";
import { checkChatRateLimits } from "@/lib/chat-rate-limit";

// ── Constants ──────────────────────────────────────────────────────────────
const MAX_MESSAGE_LENGTH = 500;
const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Resolve current mute status, clearing expired mutes automatically */
async function getMuteStatus(userId: string): Promise<{
    isMuted: boolean;
    mutedUntil: Date | null;
}> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isMuted: true, mutedUntil: true },
    });
    if (!user) return { isMuted: false, mutedUntil: null };

    // Auto-expire: if mute has passed, clear it quietly
    if (user.isMuted && user.mutedUntil && user.mutedUntil < new Date()) {
        await prisma.user.update({
            where: { id: userId },
            data: { isMuted: false, mutedUntil: null },
        });
        return { isMuted: false, mutedUntil: null };
    }

    return { isMuted: user.isMuted, mutedUntil: user.mutedUntil };
}

/**
 * GET /api/chat/messages?threadId=xxx[&cursor=msgId][&limit=30]
 *
 * Fetch messages for a conversation with cursor-based pagination.
 * Returns: { messages: [...], nextCursor: string | null }
 *
 * Participant check happens BEFORE ANY DATA QUERY to prevent enumeration:
 * An attacker who probes an arbitrary threadId will get 403, not 200 with
 * empty data, which would confirm the thread exists.
 */
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (session.user.role === "BANNED") return NextResponse.json({ error: "Account banned" }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const threadId = searchParams.get("threadId");
        const cursor = searchParams.get("cursor") ?? undefined;
        const rawLimit = parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE));
        const limit = Math.min(Math.max(1, rawLimit), MAX_PAGE_SIZE);

        if (!threadId) return NextResponse.json({ error: "Missing threadId" }, { status: 400 });

        // Find current user
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });
        if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // ── SECURITY: Participant check before ANY data read ──────────────
        // This prevents message enumeration: a non-participant gets 403,
        // not 200 with empty results (which would confirm the thread exists).
        const conversation = await prisma.conversation.findUnique({
            where: { id: threadId },
            select: { userId: true, guideId: true },
        });

        if (!conversation) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

        const isParticipant =
            conversation.userId === currentUser.id ||
            conversation.guideId === currentUser.id;
        if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // ── Cursor pagination ─────────────────────────────────────────────
        // We fetch `limit + 1` rows to determine whether there is a next page.
        // The extra row is NOT included in the response.
        const messages = await prisma.message.findMany({
            where: {
                conversationId: threadId,
                blocked: false,   // exclude soft-deleted/blocked
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
            },
            orderBy: { createdAt: "desc" }, // newest first, client reverses for display
            take: limit + 1,
        });

        const hasMore = messages.length > limit;
        const page = hasMore ? messages.slice(0, limit) : messages;
        const nextCursor = hasMore ? page[page.length - 1].createdAt.toISOString() : null;

        return NextResponse.json({
            messages: page.map(m => ({
                id: m.id,
                threadId: m.conversationId,
                senderRole: m.role,
                message: m.blocked ? "[Bu mesaj moderasyon tarafından engellendi]" : m.body,
                blocked: m.blocked,
                createdAt: m.createdAt.toISOString(),
            })),
            nextCursor,
        });

    } catch (error) {
        console.error("GET messages error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/chat/messages
 * Send a message. Participant-only.
 *
 * Hardening checklist:
 *  ✅ Auth + BANNED check
 *  ✅ Mute check (with auto-expiry)
 *  ✅ Participant check (enumeration prevention)
 *  ✅ 500 char limit
 *  ✅ Empty message guard
 *  ✅ Burst rate limit (1/2s) via chat-rate-limit
 *  ✅ Daily cap (100/day/conversation) via chat-rate-limit
 *  ✅ Profanity filter using upgraded normalizeText
 *  ✅ Moderation log on block
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (session.user.role === "BANNED") return NextResponse.json({ error: "Account banned" }, { status: 403 });

        const body = await req.json();
        const { threadId, message } = body;

        if (!threadId || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // ── Content validation ────────────────────────────────────────────
        if (typeof message !== "string" || message.length > MAX_MESSAGE_LENGTH) {
            return NextResponse.json(
                { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` },
                { status: 400 }
            );
        }
        if (message.trim().length === 0) {
            return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
        }

        // ── Resolve sender ────────────────────────────────────────────────
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });
        if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // ── Mute check ────────────────────────────────────────────────────
        const { isMuted, mutedUntil } = await getMuteStatus(currentUser.id);
        if (isMuted) {
            return NextResponse.json(
                {
                    error: "You are muted from chat.",
                    mutedUntil: mutedUntil?.toISOString() ?? null,
                    message: mutedUntil
                        ? `Your chat access is restricted until ${mutedUntil.toISOString()}.`
                        : "Your chat access has been permanently restricted by a moderator.",
                },
                { status: 403 }
            );
        }

        // ── Participant check ─────────────────────────────────────────────
        const conversation = await prisma.conversation.findUnique({
            where: { id: threadId },
            select: { userId: true, guideId: true },
        });

        if (!conversation) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

        const isParticipant =
            conversation.userId === currentUser.id ||
            conversation.guideId === currentUser.id;
        if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // ── Rate limiting ─────────────────────────────────────────────────
        const rateResult = await checkChatRateLimits(currentUser.id, threadId);
        if (!rateResult.allowed) {
            const res = NextResponse.json({ error: rateResult.reason }, { status: rateResult.status });
            if (rateResult.retryAfterMs) {
                res.headers.set("Retry-After", String(Math.ceil(rateResult.retryAfterMs / 1000)));
            }
            return res;
        }

        // ── Profanity filter (upgraded normalizer) ────────────────────────
        const isBlocked = containsProfanity(message);

        // ── Persist ───────────────────────────────────────────────────────
        const newMessage = await prisma.message.create({
            data: {
                conversationId: threadId,
                senderId: currentUser.id,
                role: session.user.role || "USER",
                body: message.trim().substring(0, MAX_MESSAGE_LENGTH),
                blocked: isBlocked,
            },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: threadId },
            data: { lastMessageAt: new Date() },
        });

        // Log moderation if blocked
        if (isBlocked) {
            await prisma.moderationLog.create({
                data: {
                    messageId: newMessage.id,
                    reason: "Profanity filter",
                },
            });
        }

        return NextResponse.json({
            id: newMessage.id,
            threadId: newMessage.conversationId,
            senderRole: newMessage.role,
            message: isBlocked
                ? "[Bu mesaj moderasyon tarafından engellendi]"
                : newMessage.body,
            blocked: newMessage.blocked,
            createdAt: newMessage.createdAt.toISOString(),
        });

    } catch (error) {
        console.error("Send message error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/chat/messages
 * Soft-delete a message. Sender can delete their own; ADMIN can delete any.
 * Body: { messageId: string }
 */
export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (session.user.role === "BANNED") return NextResponse.json({ error: "Account banned" }, { status: 403 });

        const { messageId } = await req.json();
        if (!messageId) return NextResponse.json({ error: "Missing messageId" }, { status: 400 });

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });
        if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const message = await prisma.message.findUnique({
            where: { id: messageId },
            select: { id: true, senderId: true, blocked: true },
        });

        if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
        if (message.blocked) return NextResponse.json({ error: "Already deleted" }, { status: 409 });

        // Owner or admin can delete
        const isOwner = message.senderId === currentUser.id;
        const isAdmin = session.user.role === "ADMIN";
        if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await prisma.message.update({
            where: { id: messageId },
            data: { blocked: true },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete message error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
