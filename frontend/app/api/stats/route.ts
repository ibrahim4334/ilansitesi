
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { requireSupply } from '@/lib/api-guards';

export async function GET() {
    const session = await auth();
    // VULN-3 fix: only GUIDE or ORGANIZATION should see request stats/marketplace data
    const authErr = requireSupply(session);
    if (authErr) return authErr;

    const totalRequests = await prisma.umrahRequest.count();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. Total Listing Views (Sum of views across all active listings)
    const listings = await prisma.guideListing.findMany({
        where: { guideId: session.user.id }
    });

    const totalViews = listings.reduce((acc, curr) => acc + (curr.views || 0), 0);

    // 2. Active Competition (Count of active approved listings globally)
    const activeCompetitors = await prisma.guideListing.count({
        where: { approvalStatus: 'APPROVED' }
    });

    // 3. Missed Demand / FOMO (Requests the agency did NOT bid on)
    // - Count total OPEN requests that were created in the last 30 days
    // - Subtract the ones this agency specifically opened a Conversation for.
    const totalOpenDemand = await prisma.umrahRequest.count({
        where: {
            status: 'opened',
            createdAt: { gte: thirtyDaysAgo }
        }
    });

    const agencyInteractions = await prisma.conversation.count({
        where: {
            guideId: session.user.id,
            request: {
                createdAt: { gte: thirtyDaysAgo }
            }
        }
    });

    const missedOpportunities = Math.max(0, totalOpenDemand - agencyInteractions);

    const stats = [
        { title: 'İlan Görüntülenmesi', value: totalViews.toLocaleString(), change: 5, trend: 'up' },
        { title: 'Aktif Rakipler', value: activeCompetitors.toString(), change: 0, trend: 'neutral' },
        { title: 'Kaçırılan Fırsatlar', value: missedOpportunities.toString(), change: missedOpportunities > 0 ? 100 : 0, trend: 'down' },
        { title: 'Toplam Talep', value: totalRequests.toString(), change: newRequests, trend: 'up' },
    ];

    // Get latest 5 actual requests to surface to the agency as hot leads
    const recentRequests = await prisma.umrahRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    const formattedRequests = recentRequests.map(r => ({
        id: r.id,
        customerName: "Gizli Misafir",
        listingTitle: `${r.departureCity} Çıkışlı Müsaitlik`,
        message: r.note || "Hemen Teklif İletin...",
        timeAgo: "Yeni",
        status: r.status,
        createdAt: r.createdAt.toISOString()
    }));

    return NextResponse.json({ stats, recentRequests: formattedRequests });
}
