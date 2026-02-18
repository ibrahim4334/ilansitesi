import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { TokenService } from "@/lib/token-service"

/**
 * POST /api/choose-role
 * Non-admin endpoint: lets a logged-in user pick their role during onboarding.
 * Only works if the user doesn't already have a role.
 */
export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { role } = await req.json()

        if (!['USER', 'GUIDE', 'ORGANIZATION'].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 })
        }

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Only allow role selection if user has no role yet
        if (user.role) {
            // If user already has a role, just return success (idempotent)
            return NextResponse.json({ success: true, role: user.role })
        }

        // Update role in a transaction (with profile creation for GUIDE/ORG)
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
                            credits: 30,
                            package: "FREEMIUM",
                            tokens: 0
                        }
                    })

                    await tx.creditTransaction.create({
                        data: {
                            userId: user.id,
                            amount: 30,
                            type: "admin",
                            reason: "Initial signup credits",
                        }
                    })
                }
            }
        })

        return NextResponse.json({ success: true, role })

    } catch (error) {
        console.error("Choose Role Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
