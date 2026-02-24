
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/api-guards';

export async function POST(req: Request) {
    const session = await auth();
    // VULN-4 fix: only USERs can favorite requests
    const authErr = requireRole(session, 'USER');
    if (authErr) return authErr;

    // requireRole guarantees session is non-null, user.email is set
    const userEmail = session!.user.email!;

    try {
        const { requestId } = await req.json();

        // Check if favorite exists
        const existing = await prisma.requestFavorite.findUnique({
            where: {
                requestId_userId: {
                    requestId,
                    userId: userEmail
                }
            }
        });

        if (existing) {
            // Remove (Unfavorite)
            await prisma.requestFavorite.delete({
                where: { id: existing.id }
            });
            return NextResponse.json({ favorited: false });
        } else {
            // Add (Favorite)
            await prisma.requestFavorite.create({
                data: {
                    requestId,
                    userId: userEmail
                }
            });
            return NextResponse.json({ favorited: true });
        }
    } catch (e) {
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await auth();
    // VULN-4 fix: only USERs can read their own favorites
    const authErr = requireRole(session, 'USER');
    if (authErr) return authErr;

    // requireRole guarantees session is non-null, user.email is set
    const userEmail = session!.user.email!;

    const favorites = await prisma.requestFavorite.findMany({
        where: { userId: userEmail },
        select: { requestId: true }
    });

    return NextResponse.json({ favorites: favorites.map(f => f.requestId) });
}
