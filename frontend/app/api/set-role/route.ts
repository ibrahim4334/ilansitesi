import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

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

        // 1. Update WordPress - Graceful Fail
        try {
            const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost/umre/kurulum/umrebuldum';
            await fetch(`${wpUrl}/wp-json/umrebuldum/v1/set-role`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: session.user.email,
                    role
                })
            })
        } catch (wpError) {
            // Log but DO NOT fail the request. Allow user to proceed.
            console.warn("WP Set Role Failed (Non-blocking):", wpError);
        }

        // Return refresh: true to signal the client to update session
        return NextResponse.json({
            success: true,
            role,
            refresh: true
        })

    } catch (error) {
        console.error("Set Role Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
