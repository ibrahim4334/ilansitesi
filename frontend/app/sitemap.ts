import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

// The base URL of the application
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://umrebuldum.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    try {
        // 1. Fetch all static routes
        const staticRoutes: MetadataRoute.Sitemap = [
            {
                url: `${BASE_URL}/`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1.0,
            },
            {
                url: `${BASE_URL}/turlar`,
                lastModified: new Date(),
                changeFrequency: 'hourly',
                priority: 0.9,
            },
            {
                url: `${BASE_URL}/rehberler`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.8,
            },
            {
                url: `${BASE_URL}/acente-kayit`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.7,
            },
        ];

        // 2. Fetch all pSEO Landing Pages generated dynamically
        // Limit to 45,000 per sitemap purely for safety (Google limit is 50k)
        // In the future this should be paginated (e.g., sitemap-1.xml, sitemap-2.xml)
        const pseoPages = await prisma.seoLandingPage.findMany({
            where: {
                isIndexed: true,
            },
            select: {
                slug: true,
                updatedAt: true,
                pageType: true,
            },
            take: 20000,
            orderBy: {
                viewCount: 'desc' // Prioritize highest traffic routes
            }
        });

        const dynamicPseoRoutes: MetadataRoute.Sitemap = pseoPages.map((page) => ({
            // We route all custom slugs to the root domain or designated folder based on architecture.
            // Based on our implementation, they are at root via Next.js catch-all or designated folder group.
            url: `${BASE_URL}/${page.slug}`,
            lastModified: page.updatedAt,
            // City pages change often as new listings are added. Attribute pages are fairly static.
            changeFrequency: page.pageType === 'CITY' ? 'hourly' : 'daily',
            priority: page.pageType === 'CITY' ? 0.8 : 0.6,
        }));

        // 3. Fetch all active Public Profiles (Agencies)
        const activeAgencies = await prisma.user.findMany({
            where: {
                role: "GUIDE",
            },
            select: {
                id: true,
            },
            take: 10000
        });

        const profileRoutes: MetadataRoute.Sitemap = activeAgencies.map((agency) => ({
            url: `${BASE_URL}/profil/${agency.id}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        }));

        // 4. Combine all arrays
        return [...staticRoutes, ...dynamicPseoRoutes, ...profileRoutes];

    } catch (error) {
        console.error('Error generating sitemap:', error);
        // Fallback static sitemap if DB is down during build
        return [
            {
                url: `${BASE_URL}/`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1.0,
            }
        ];
    }
}
