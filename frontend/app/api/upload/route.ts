import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/api-guards";
import { rateLimit } from "@/lib/rate-limit";
import { safeErrorMessage } from "@/lib/safe-error";

// ── Security constants ──────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Strip path separators and keep only safe characters to prevent traversal */
function sanitizeFilename(raw: string): string {
    return path.basename(raw)          // strip any leading path components
        .replace(/[^a-zA-Z0-9._-]/g, "_") // allow only safe chars
        .substring(0, 200);            // cap length
}

export async function POST(req: Request) {
    try {
        const session = await auth();

        // VULN-2: requireAuth blocks unauthenticated AND BANNED users
        const guard = requireAuth(session);
        if (guard) return guard;

        // Rate limit: 5 uploads per minute per user
        const rl = rateLimit(`upload:${session!.user.email}`, 60_000, 5);
        if (!rl.success) {
            return NextResponse.json(
                { error: "Too many uploads. Please wait." },
                { status: 429, headers: { "Retry-After": "60" } }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file received." }, { status: 400 });
        }

        // VULN-8a: File type validation — allowlist only
        if (!ALLOWED_MIME_TYPES.has(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." },
                { status: 415 }
            );
        }

        // VULN-8b: Size limit
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 5 MB." },
                { status: 413 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // VULN-8c: Sanitize filename — prevent path traversal
        const sanitized = sanitizeFilename(file.name);
        const filename = `${Date.now()}_${sanitized}`;

        // Ensure "public/uploads" exists
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });

        // Final safety: resolve and verify path stays inside uploadDir
        const filePath = path.resolve(uploadDir, filename);
        if (!filePath.startsWith(path.resolve(uploadDir))) {
            return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
        }

        await writeFile(filePath, buffer);

        return NextResponse.json({
            success: true,
            url: `/uploads/${filename}`
        });

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: safeErrorMessage(error, "Upload failed") }, { status: 500 });
    }
}
