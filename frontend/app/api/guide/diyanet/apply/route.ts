import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSupply } from "@/lib/api-guards";
import { PackageSystem } from "@/lib/package-system";
import { safeErrorMessage } from "@/lib/safe-error";

/**
 * POST /api/guide/diyanet/apply
 * Apply for Diyanet badge. Requires at least 1 paid package.
 *
 * Body: { idDocumentUrl, certificateUrl, contactEmail, note? }
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireSupply(session);
        if (guard) return guard;

        const body = await req.json();
        const { idDocumentUrl, certificateUrl, contactEmail, note } = body;

        // Validate required fields
        if (!idDocumentUrl || !certificateUrl || !contactEmail) {
            return NextResponse.json({
                error: "Kimlik fotoğrafı, Diyanet belgesi ve e-posta zorunludur",
            }, { status: 400 });
        }

        // Email format check
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
            return NextResponse.json({ error: "Geçersiz e-posta adresi" }, { status: 400 });
        }

        // Resolve user
        const user = await prisma.user.findUnique({
            where: { email: session!.user.email! },
            select: { id: true, packageType: true, isDiyanetVerified: true },
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Already verified
        if (user.isDiyanetVerified) {
            return NextResponse.json({ error: "Zaten Diyanet onaylısınız" }, { status: 400 });
        }

        // Package requirement: must have at least 1 paid package
        if (user.packageType === "FREE") {
            return NextResponse.json({
                error: "Diyanet rozeti için en az bir ücretli paket gereklidir",
                code: "PACKAGE_REQUIRED",
            }, { status: 403 });
        }

        // Diyanet eligibility check
        if (!PackageSystem.isDiyanetEligible(user.packageType)) {
            return NextResponse.json({
                error: "Mevcut paketiniz Diyanet rozeti başvurusunu desteklemiyor",
            }, { status: 403 });
        }

        // Check for existing pending application
        const existing = await prisma.diyanetApplication.findFirst({
            where: {
                userId: user.id,
                status: { in: ["PENDING", "APPROVED"] },
            },
        });
        if (existing) {
            if (existing.status === "PENDING") {
                return NextResponse.json({
                    error: "Zaten bekleyen bir başvurunuz var",
                    applicationId: existing.id,
                }, { status: 409 });
            }
            if (existing.status === "APPROVED") {
                return NextResponse.json({
                    error: "Başvurunuz zaten onaylanmış",
                }, { status: 409 });
            }
        }

        // Create application
        const application = await prisma.diyanetApplication.create({
            data: {
                userId: user.id,
                idDocumentUrl: idDocumentUrl.trim(),
                certificateUrl: certificateUrl.trim(),
                contactEmail: contactEmail.trim().toLowerCase(),
                note: note?.trim()?.substring(0, 500) || null,
                packageAtApply: user.packageType,
                status: "PENDING",
            },
        });

        console.log(`[Diyanet] New application: ${application.id} from user ${user.id}`);

        return NextResponse.json({
            success: true,
            message: "Başvurunuz alındı. Admin incelemesi sonrası bilgilendirileceksiniz.",
            applicationId: application.id,
        }, { status: 201 });

    } catch (error) {
        console.error("Diyanet apply error:", error);
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
    }
}

/**
 * GET /api/guide/diyanet/apply
 * Get current user's Diyanet application status.
 */
export async function GET(req: Request) {
    try {
        const session = await auth();
        const guard = requireSupply(session);
        if (guard) return guard;

        const user = await prisma.user.findUnique({
            where: { email: session!.user.email! },
            select: { id: true },
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const application = await prisma.diyanetApplication.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                status: true,
                rejectionReason: true,
                createdAt: true,
                reviewedAt: true,
            },
        });

        return NextResponse.json({ application });
    } catch (error) {
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
    }
}
