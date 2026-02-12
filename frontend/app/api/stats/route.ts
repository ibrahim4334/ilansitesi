
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { requireAuth } from '@/lib/api-guards';

export async function GET() {
    const session = await auth();
    const authErr = requireAuth(session);
    if (authErr) return authErr;

    const totalRequests = await prisma.umrahRequest.count();

    // New requests in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newRequests = await prisma.umrahRequest.count({
        where: {
            createdAt: { gte: oneDayAgo }
        }
    });

    const stats = [
        { title: 'Görüntülenme', value: '12,456', change: 12, trend: 'up' },
        { title: 'Tıklama', value: '2,341', change: 8, trend: 'up' },
        { title: 'Talep', value: totalRequests.toString(), change: newRequests, trend: 'up' },
        { title: 'Dönüşüm', value: '%5.2', change: -2, trend: 'down' },
    ];

    // Get latest 5 requests
    const recentRequests = await prisma.umrahRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    const formattedRequests = recentRequests.map(r => ({
        id: r.id,
        customerName: "Misafir Kullanıcı",
        listingTitle: `${r.departureCity}`,
        message: r.note || "Detay yok",
        timeAgo: "Yeni",
        status: 'new',
        createdAt: r.createdAt.toISOString()
    }));

    return NextResponse.json({ stats, recentRequests: formattedRequests });
}
