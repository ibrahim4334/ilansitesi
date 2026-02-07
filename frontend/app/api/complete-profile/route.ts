import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(req: Request) {
    const session = await auth()
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { role } = await req.json()

        if (!['umreci', 'rehber', 'organizasyon'].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 })
        }

        // 1. Update WordPress (Primary Source of Truth)
        const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost/umre/kurulum/umrebuldum';

        // Non-blocking catch for WP to avoid crashing dev if WP is down
        let wpSuccess = false;
        try {
            const res = await fetch(`${wpUrl}/wp-json/umrebuldum/v1/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: session.user.email,
                    role: role,
                    provider: 'onboarding_update'
                }),
            });
            if (res.ok) wpSuccess = true;
        } catch (e) {
            console.warn("WP Sync Warning:", e);
        }

        // 2. Update Local DB (Critical for Localhost/Windows Persistence)
        const dbPath = path.join(process.cwd(), "data", "db.json")
        if (fs.existsSync(dbPath)) {
            try {
                const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
                const userIndex = db.users.findIndex((u: any) => u.email === session.user.email)

                if (userIndex !== -1) {
                    db.users[userIndex] = {
                        ...db.users[userIndex],
                        role: role
                    }
                    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
                    console.log(`Local DB updated for user ${session.user.email}: Role set to ${role}`);
                }
            } catch (dbError) {
                console.error("Local DB Update Failed:", dbError);
            }
        }

        return NextResponse.json({ success: true, role })

    } catch (error) {
        console.error("Onboarding Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
