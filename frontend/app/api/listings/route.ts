
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PackageSystem } from "@/lib/package-system";
import { requireSupply } from "@/lib/api-guards";
import { rateLimit } from "@/lib/rate-limit";
import { getRoleConfig } from "@/lib/role-config";
import { safeErrorMessage } from "@/lib/safe-error";
import { calculateListingScore } from "@/lib/listing-ranking";
import type { GuidePackage } from "@/lib/db-types";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const guideId = searchParams.get('guideId');
        const departureCityId = searchParams.get('departureCity') || searchParams.get('departureCityId'); // Handle both params
        const searchDate = searchParams.get('date');
        const minDate = searchParams.get('minDate');
        const maxDate = searchParams.get('maxDate');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const isIdentityVerifiedFilter = searchParams.get('isIdentityVerified');

        const now = new Date();

        // Build where clause — query-level expiration filter
        const where: any = {
            status: 'ACTIVE',
            approvalStatus: 'APPROVED',
            deletedAt: null,
            expiresAt: { gt: now },      // Only non-expired
            endDate: { gte: now }
        };

        if (guideId) where.guideId = guideId;
        if (departureCityId && departureCityId !== 'all') {
            where.departureCityId = departureCityId;
        }

        if (isIdentityVerifiedFilter === 'true') {
            where.guide = { isIdentityVerified: true };
        }

        let listings = await prisma.guideListing.findMany({
            where,
            include: {
                guide: true,
                departureCity: true,
                airline: true,
                tourDays: { orderBy: { day: 'asc' } }
            },
            orderBy: [
                { isFeatured: 'desc' },
                { updatedAt: 'desc' }
            ]
        });

        // Date range filtering
        if (minDate || maxDate) {
            listings = listings.filter(l => {
                const lStart = l.startDate.getTime();
                const lEnd = l.departureDateEnd ? l.departureDateEnd.getTime() : lStart;

                const searchMin = minDate ? new Date(minDate).getTime() : -Infinity;
                const searchMax = maxDate ? new Date(maxDate).getTime() : Infinity;

                return lStart <= searchMax && lEnd >= searchMin;
            });
        } else if (searchDate) {
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
                // Map relation to string name for frontend compatibility, or send object
                departureCity: l.departureCity?.name || l.departureCityOld || "Unknown",
                departureCityId: l.departureCityId,
                meetingCity: l.meetingCity,
                extraServices: l.extraServices,
                hotelName: l.hotelName,
                airline: l.airline?.name || l.airlineOld || "Unknown",
                airlineId: l.airlineId,
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
                    // phone deliberately omitted from list view — exposed only on detail page
                    // after PackageSystem.isPhoneVisible() check
                    isIdentityVerified: profile.isIdentityVerified,
                    photo: profile.photo,
                    trustScore: profile.trustScore || 50,
                    completedTrips: profile.completedTrips || 0,
                    package: profile.package || "FREEMIUM"
                } : null
            };
        });

        // Calculate ranking scores and sort
        const scoredListings = enrichedListings.map(l => ({
            ...l,
            _score: calculateListingScore(
                {
                    isFeatured: l.isFeatured || false,
                    featuredUntil: null, // raw data not included in enriched, handled by query sort
                    updatedAt: new Date(l.createdAt || Date.now()),
                    filled: l.filled || 0,
                    quota: l.quota || 30,
                },
                {
                    trustScore: l.guide?.trustScore || 50,
                    completedTrips: l.guide?.completedTrips || 0,
                    isIdentityVerified: l.guide?.isIdentityVerified || false,
                    priorityRanking: l.guide?.package ? PackageSystem.getLimits(l.guide.package as GuidePackage).priorityRanking : false,
                },
            ),
        }));

        scoredListings.sort((a, b) => (b._score || 0) - (a._score || 0));

        return NextResponse.json(scoredListings);
    } catch (error) {
        console.error("Fetch listings error:", error);
        return NextResponse.json({ error: safeErrorMessage(error, "Failed to fetch listings") }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireSupply(session);
        if (guard) return guard;

        const body = await req.json();
        const {
            title,
            description,
            city,
            quota,
            departureCityId, // Expecting ID
            meetingCity,
            extraServices,
            hotelName,
            airlineId, // Expecting ID
            pricing,
            startDate,
            endDate,
            totalDays,
            tourPlan,
            urgencyTag,
            legalConsent,
        } = body;

        // Validation
        if (!title || !departureCityId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        if (!legalConsent) return NextResponse.json({ error: "Yasal sorumluluk beyanı zorunludur." }, { status: 400 });

        // Rate limit: 5 listings per 5 minutes
        const rl = rateLimit(`listing:${session!.user.email}`, 300_000, 5);
        if (!rl.success) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        // Bounds validation
        if (pricing?.double && (pricing.double < 0 || pricing.double > 1_000_000)) {
            return NextResponse.json({ error: "Invalid price range" }, { status: 400 });
        }
        if (pricing?.triple && (pricing.triple < 0 || pricing.triple > 1_000_000)) {
            return NextResponse.json({ error: "Invalid price range" }, { status: 400 });
        }
        if (pricing?.quad && (pricing.quad < 0 || pricing.quad > 1_000_000)) {
            return NextResponse.json({ error: "Invalid price range" }, { status: 400 });
        }
        if (quota && (parseInt(quota) < 1 || parseInt(quota) > 500)) {
            return NextResponse.json({ error: "Invalid quota (1-500)" }, { status: 400 });
        }
        if (totalDays && (parseInt(totalDays) < 1 || parseInt(totalDays) > 60)) {
            return NextResponse.json({ error: "Invalid totalDays (1-60)" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session!.user.email! }
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Validate City and Airline existence (Optional strictly speaking but good for integrity)
        const cityExists = await prisma.departureCity.findUnique({ where: { id: departureCityId } });
        if (!cityExists) return NextResponse.json({ error: "Invalid Departure City" }, { status: 400 });

        let airlineName = "THY"; // Fallback for legacy string field if needed
        if (airlineId) {
            const airlineExists = await prisma.airline.findUnique({ where: { id: airlineId } });
            if (airlineExists) airlineName = airlineExists.name;
        }

        // Get or create profile
        let profile = await prisma.guideProfile.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                fullName: session!.user.name || "Unknown Guide",
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
        // Check ROLE_CONFIG cap (hard architectural limit)
        const roleConfig = getRoleConfig(session!.user.role);
        if (currentListingsCount >= roleConfig.maxActiveListings) {
            return NextResponse.json({
                error: "Listing limit reached",
                message: `Rolünüz için maksimum ${roleConfig.maxActiveListings} aktif ilan oluşturabilirsiniz.`,
                code: "ROLE_LIMIT_REACHED"
            }, { status: 403 });
        }
        // Check package limits (business layer — may be more restrictive)
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
                // Relations
                departureCityId,
                departureCityOld: cityExists.name, // Legacy sync
                meetingCity: meetingCity || null,
                extraServices: Array.isArray(extraServices) ? extraServices : [],
                hotelName: hotelName || null,
                // Relations
                airlineId: airlineId || null,
                airlineOld: airlineName, // Legacy sync

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
                departureDateEnd: body.departureDateEnd ? new Date(body.departureDateEnd) : null,
                endDate: endDate ? new Date(endDate) : new Date(Date.now() + 86400000 * 10),
                returnDateEnd: body.returnDateEnd ? new Date(body.returnDateEnd) : null,
                totalDays: totalDays ? parseInt(totalDays) : 10,
                // Auto-set expiration based on package
                expiresAt: (() => {
                    const days = PackageSystem.getListingDuration(profile.package as GuidePackage);
                    const exp = new Date();
                    exp.setDate(exp.getDate() + days);
                    return exp;
                })(),
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
        return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
    }
}
