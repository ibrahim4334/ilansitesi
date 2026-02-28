import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-guards"
import { getRoleConfig } from "@/lib/role-config"
import { safeErrorMessage } from "@/lib/safe-error"

/**
 * POST /api/choose-role
 * Non-admin endpoint: lets a logged-in user pick their role during onboarding.
 * Only works if the user doesn't already have a role.
 */
export async function POST(req: Request) {
    const session = await auth()
    const guard = requireAuth(session)
    if (guard) return guard

    try {
        const { role } = await req.json()

        if (!['USER', 'GUIDE', 'ORGANIZATION'].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 })
        }

        // Find the user — email guaranteed non-null after requireAuth
        const user = await prisma.user.findUnique({
            where: { email: session!.user.email! }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Only allow role selection if user has no role yet
        if (user.role) {
            // If user already has a role, just return success (idempotent)
            return NextResponse.json({ success: true, role: user.role })
        }

        // Step 1: Set role + create profile in one transaction
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: user.id },
                data: { role }
            })

            if (role === 'GUIDE' || role === 'ORGANIZATION') {
                // Initialize profile fields on User directly
                await tx.user.update({
                    where: { id: user.id },
                    data: {
                        fullName: user.name || "Kullanıcı",
                        city: "İstanbul"
                    }
                })
            }
        })

        // Note: Tokens are no longer granted here to prevent Freemium Abuse.
        // Guides must complete their profiles and use /api/onboarding/claim-tokens

        return NextResponse.json({ success: true, role })

    } catch (error) {
        console.error("Choose Role Error:", error)
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
    }
}
