
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PackageSystem } from "@/lib/package-system";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const guideId = searchParams.get('guideId');
        const departureCity = searchParams.get('departureCity');
        const searchDate = searchParams.get('date');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const isDiyanetFilter = searchParams.get('isDiyanet');

        const now = new Date();

        // Build where clause
        const where: any = {
            active: true,
            approvalStatus: 'APPROVED',
            endDate: { gte: now }
        };

        if (guideId) where.guideId = guideId;
        if (departureCity && departureCity !== 'all') {
            where.departureCity = { equals: departureCity, mode: 'insensitive' as any };
        }

        if (isDiyanetFilter === 'true') {
            where.guide = { isDiyanet: true };
        }

        let listings = await prisma.guideListing.findMany({
            where,
            include: {
                guide: true,
                tourDays: { orderBy: { day: 'asc' } }
            },
            orderBy: [
                { isFeatured: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        // Date range filtering (start <= search <= end)
        if (searchDate) {
            listings = listings.filter(l => {
                const start = l.startDate.toISOString().split('T')[0];
                const end = l.endDate.toISOString().split('T')[0];
                return searchDate >= start && searchDate <= end;
            });
        }

        // Price filtering
        if (minPrice || maxPrice) {
            const min = minPrice ? parseFloat(minPrice) : 0;
            const max = maxPrice ? parseFloat(maxPrice) : Infinity;
            listings = listings.filter(l => {
                const prices = [l.pricingQuad, l.pricingTriple, l.pricingDouble].filter(p => p > 0);
                const price = prices.length > 0 ? Math.min(...prices) : (l.price || 0);
                return price >= min && price <= max;
            });
        }

        // Enrich with guide profile data
        const enrichedListings = listings.map(l => {
            const profile = l.guide;
            const showPhone = profile ? PackageSystem.isPhoneVisible(profile) : false;

            return {
                id: l.id,
                guideId: l.guideId,
                title: l.title,
                description: l.description,
                city: l.city,
                departureCity: l.departureCity,
                meetingCity: l.meetingCity,
                extraServices: l.extraServices,
                hotelName: l.hotelName,
                airline: l.airline,
                pricing: {
                    double: l.pricingDouble,
                    triple: l.pricingTriple,
                    quad: l.pricingQuad,
                    currency: l.pricingCurrency
                },
                price: l.price,
                quota: l.quota,
                filled: l.filled,
                active: l.active,
                isFeatured: l.isFeatured,
                startDate: l.startDate.toISOString().split('T')[0],
                endDate: l.endDate.toISOString().split('T')[0],
                totalDays: l.totalDays,
                tourPlan: l.tourDays.map(d => ({
                    day: d.day,
                    city: d.city,
                    title: d.title,
                    description: d.description
                })),
                approvalStatus: l.approvalStatus,
                urgencyTag: l.urgencyTag,
                legalConsent: l.legalConsent,
                consentTimestamp: l.consentTimestamp?.toISOString(),
                image: l.image,
                createdAt: l.createdAt.toISOString(),
                guide: profile ? {
                    fullName: profile.fullName,
                    city: profile.city,
                    bio: profile.bio,
                    phone: showPhone ? profile.phone : null,
                    isDiyanet: profile.isDiyanet,
                    photo: profile.photo,
                    trustScore: profile.trustScore || 50,
                    completedTrips: profile.completedTrips || 0,
                    package: profile.package || "FREEMIUM"
                } : null
            };
        });

        return NextResponse.json(enrichedListings);
    } catch (error) {
        console.error("Fetch listings error:", error);
        return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (session.user.role !== 'GUIDE' && session.user.role !== 'ORGANIZATION') return NextResponse.json({ error: "Forbidden: Guides/Orgs only" }, { status: 403 });

        const body = await req.json();
        const {
            title,
            description,
            city,
            quota,
            departureCity,
            meetingCity,
            extraServices,
            hotelName,
            airline,
            pricing,
            startDate,
            endDate,
            totalDays,
            tourPlan,
            urgencyTag,
            legalConsent,
        } = body;

        if (!title || !departureCity) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        if (!legalConsent) return NextResponse.json({ error: "Yasal sorumluluk beyanı zorunludur." }, { status: 400 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Get or create profile
        let profile = await prisma.guideProfile.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                fullName: session.user.name || "Unknown Guide",
                phone: "",
                city: city || "",
                credits: 0,
                package: "FREEMIUM",
                tokens: 0
            }
        });

        // Check package limits
        const currentListingsCount = await prisma.guideListing.count({
            where: { guideId: user.id, active: true }
        });
        if (!PackageSystem.canCreateListing(profile, currentListingsCount)) {
            return NextResponse.json({
                error: "Limit Reached",
                message: "Paket limitinize ulaştınız. Daha fazla tur eklemek için paketinizi yükseltin.",
                code: "LIMIT_REACHED"
            }, { status: 403 });
        }

        // Normalize pricing
        const pDouble = pricing?.double || 0;
        const pTriple = pricing?.triple || 0;
        const pQuad = pricing?.quad || (body.price ? parseFloat(body.price) : 0);
        const basePrice = Math.min(
            pQuad || Infinity,
            pTriple || Infinity,
            pDouble || Infinity
        );

        const newListing = await prisma.guideListing.create({
            data: {
                guideId: user.id,
                title,
                description: description || "",
                city: city || "",
                departureCity,
                meetingCity: meetingCity || null,
                extraServices: Array.isArray(extraServices) ? extraServices : [],
                hotelName: hotelName || null,
                airline: airline || "THY",
                pricingDouble: pDouble,
                pricingTriple: pTriple,
                pricingQuad: pQuad,
                pricingCurrency: pricing?.currency || "SAR",
                price: basePrice === Infinity ? 0 : basePrice,
                quota: quota ? parseInt(quota) : 30,
                filled: 0,
                active: true,
                isFeatured: false,
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : new Date(Date.now() + 86400000 * 10),
                totalDays: totalDays ? parseInt(totalDays) : 10,
                approvalStatus: 'PENDING',
                urgencyTag: urgencyTag || null,
                legalConsent: !!legalConsent,
                consentTimestamp: new Date(),
                // Create tour days if provided
                tourDays: tourPlan && tourPlan.length > 0 ? {
                    create: tourPlan.map((d: any) => ({
                        day: d.day || 1,
                        city: d.city || "",
                        title: d.title || "",
                        description: d.description || ""
                    }))
                } : undefined
            },
            include: {
                tourDays: { orderBy: { day: 'asc' } }
            }
        });

        // Format response to match old API shape
        const response = {
            ...newListing,
            pricing: {
                double: newListing.pricingDouble,
                triple: newListing.pricingTriple,
                quad: newListing.pricingQuad,
                currency: newListing.pricingCurrency
            },
            tourPlan: newListing.tourDays.map(d => ({
                day: d.day,
                city: d.city,
                title: d.title,
                description: d.description
            })),
            startDate: newListing.startDate.toISOString().split('T')[0],
            endDate: newListing.endDate.toISOString().split('T')[0],
            createdAt: newListing.createdAt.toISOString()
        };

        return NextResponse.json({
            success: true,
            listing: response,
            message: "İlanınız kontrol ediliyor."
        }, { status: 201 });

    } catch (error) {
        console.error("Create listing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
