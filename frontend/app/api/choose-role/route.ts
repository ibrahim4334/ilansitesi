import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-guards"
import { TokenService } from "@/lib/token-service"
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
                const existing = await tx.guideProfile.findUnique({
                    where: { userId: user.id }
                })

                if (!existing) {
                    await tx.guideProfile.create({
                        data: {
                            userId: user.id,
                            fullName: user.name || "Kullanıcı",
                            phone: user.phone || "",
                            city: "İstanbul",
                            quotaTarget: 100,
                            currentCount: 0,
                            isApproved: false,
                            credits: 0, // TokenService will set the real value
                            package: "FREEMIUM",
                            tokens: 0
                        }
                    })
                }
            }
        })

        // Step 2: Grant onboarding bonus via TokenService (idempotent)
        const config = getRoleConfig(role)
        if (config.onboardingBonus > 0) {
            await TokenService.grantCredits(
                user.id,
                config.onboardingBonus,
                "admin",
                "Initial signup credits",
                undefined,
                `onboarding:${user.id}` // idempotent — safe on retry
            )
        }

        return NextResponse.json({ success: true, role })

    } catch (error) {
        console.error("Choose Role Error:", error)
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
    }
}
