
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { requireAuth } from '@/lib/api-guards';

export async function POST(req: Request) {
    const session = await auth();
    const authErr = requireAuth(session);
    if (authErr) return authErr;

    try {
        const body = await req.json();
        const { contactConsent } = body;

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { contactConsent: Boolean(contactConsent) }
        });

        return NextResponse.json({ success: true, contactConsent: updatedUser.contactConsent });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
