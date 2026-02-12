
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { requireAuth } from '@/lib/api-guards';

export async function POST(req: Request) {
    const session = await auth();
    const authErr = requireAuth(session);
    if (authErr) return authErr;

    try {
        const { requestId } = await req.json();

        // Check if favorite exists
        const existing = await prisma.requestFavorite.findUnique({
            where: {
                requestId_userId: {
                    requestId,
                    userId: session.user.email
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
                    userId: session.user.email
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
    const authErr = requireAuth(session);
    if (authErr) return authErr;

    const favorites = await prisma.requestFavorite.findMany({
        where: { userId: session.user.email },
        select: { requestId: true }
    });

    return NextResponse.json({ favorites: favorites.map(f => f.requestId) });
}
