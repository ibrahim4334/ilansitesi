import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";
import { getVaultPresignedUrl } from "@/lib/s3-client";
import { logAdminAction } from "@/lib/admin-audit";
import { safeErrorMessage } from "@/lib/safe-error";

/**
 * GET /api/admin/kyc/[id]
 * Retrieves a short-lived (60s) pre-signed URL to view a private KYC document.
 * Protects against IDOR by strictly requiring an ACTIVE ADMIN session.
 */
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const adminUser = await prisma.user.findUnique({
            where: { email: session!.user.email! }
        });
        if (!adminUser) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

        const applicationId = params.id;
        if (!applicationId) return NextResponse.json({ error: "Missing application ID" }, { status: 400 });

        // Lookup the IdentityApplication
        const application = await prisma.identityApplication.findUnique({
            where: { id: applicationId },
            include: { user: true }
        });

        if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

        // Extract the Vault Key
        // Format was saved as vault://kyc/userId/filename
        const urlPrefix = "vault://";

        // Let's generate URLs for both the ID Document and the Certificate
        let idDocSignedUrl: string | null = null;
        let certSignedUrl: string | null = null;

        if (application.idDocumentUrl?.startsWith(urlPrefix)) {
            const idDocKey = application.idDocumentUrl.slice(urlPrefix.length);
            idDocSignedUrl = await getVaultPresignedUrl(idDocKey, 60); // 60 seconds
        } else {
            // Legacy / Public File (Backwards compatibility)
            idDocSignedUrl = application.idDocumentUrl;
        }

        if (application.certificateUrl?.startsWith(urlPrefix)) {
            const certKey = application.certificateUrl.slice(urlPrefix.length);
            certSignedUrl = await getVaultPresignedUrl(certKey, 60);
        } else {
            certSignedUrl = application.certificateUrl; // Legacy
        }

        // Audit Trail: Log that this admin accessed highly sensitive KYC PII
        await logAdminAction(
            adminUser.id,
            "view_kyc_pii",
            application.userId,
            "Admin generated pre-signed URL for KYC document review",
            { applicationId }
        );

        return NextResponse.json({
            success: true,
            idDocumentUrl: idDocSignedUrl,
            certificateUrl: certSignedUrl,
            expiresIn: 60,
        });

    } catch (error) {
        console.error("KYC URL Presigner error:", error);
        return NextResponse.json({ error: safeErrorMessage(error, "Failed to generate visual access") }, { status: 500 });
    }
}
