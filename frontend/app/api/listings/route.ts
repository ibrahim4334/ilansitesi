
import { auth } from "@/lib/auth";
import { db, GuideListing, Pricing } from "@/lib/db";
import { NextResponse } from "next/server";
import { PackageSystem } from "@/lib/package-system";

export async function GET(req: Request) {
    // Public endpoint to fetch listings
    // Optional: ?guideId=... to filter
    try {
        const { searchParams } = new URL(req.url);
        const guideId = searchParams.get('guideId');

        // Filters
        // Filters
        const departureCity = searchParams.get('departureCity');
        const searchDate = searchParams.get('date');
        const roomType = searchParams.get('roomType');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const isDiyanet = searchParams.get('isDiyanet');

        const database = db.read();
        const now = new Date();

        let listings = database.guideListings.filter(l => {
            if (!l.active) return false;
            if (l.approvalStatus !== 'APPROVED') return false;

            // Check expiry
            if (l.endDate) {
                // Use string comparison for ISO dates YYYY-MM-DD
                if (l.endDate < now.toISOString().split('T')[0]) return false;
            }
            return true;
        });

        if (guideId) {
            listings = listings.filter(l => l.guideId === guideId);
        }

        if (departureCity && departureCity !== 'all') {
            listings = listings.filter(l => l.departureCity.toLowerCase() === departureCity.toLowerCase());
        }

        // Date Logic: Range match (start <= search <= end)
        if (searchDate) {
            listings = listings.filter(l => {
                if (l.startDate && l.endDate) {
                    return searchDate >= l.startDate && searchDate <= l.endDate;
                }
                return true;
            });
        }

        if (isDiyanet === 'true') {
            // We need to filter by guide's isDiyanet status.
            listings = listings.filter(l => {
                const p = database.guideProfiles.find(prof => prof.userId === l.guideId);
                return p?.isDiyanet;
            });
        }

        // Price filtering
        if (minPrice || maxPrice) {
            const min = minPrice ? parseFloat(minPrice) : 0;
            const max = maxPrice ? parseFloat(maxPrice) : Infinity;
            listings = listings.filter(l => {
                let price = l.price || 0;
                if (l.pricing) {
                    const prices = [l.pricing.quad, l.pricing.triple, l.pricing.double].filter(p => p > 0);
                    if (prices.length > 0) price = Math.min(...prices);
                }
                return price >= min && price <= max;
            });
        }

        // Enrich with guide profile data
        const enrichedListings = listings.map(l => {
            const profile = database.guideProfiles.find(p => p.userId === l.guideId);

            // Check visibility rules
            const showPhone = profile ? PackageSystem.isPhoneVisible(profile) : false;

            return {
                ...l,
                guide: profile ? {
                    fullName: profile.fullName,
                    city: profile.city,
                    bio: profile.bio,
                    phone: showPhone ? profile.phone : null, // Hide phone if not allowed
                    isDiyanet: profile.isDiyanet,
                    photo: profile.photo,
                    trustScore: profile.trustScore || 50,
                    completedTrips: profile.completedTrips || 0,
                    package: profile.package || "FREEMIUM"
                } : null
            };
        });

        // Sort: Featured first
        // Sort: Featured first, then Newest (Start Date)
        enrichedListings.sort((a, b) => {
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;

            // Secondary sort: Newest (createdAt Descending)
            const dateA = new Date(a.createdAt || a.startDate || 0).getTime();
            const dateB = new Date(b.createdAt || b.startDate || 0).getTime();
            return dateB - dateA;
        });

        return NextResponse.json(enrichedListings);
    } catch (error) {
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
            // New / Normalized fields
            pricing, // { double, triple, quad }
            startDate,
            endDate,
            totalDays,
            // Phase 10
            tourPlan,
            urgencyTag,
            legalConsent,
            posterImages
        } = body;

        if (!title || !departureCity) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        if (!legalConsent) return NextResponse.json({ error: "Yasal sorumluluk beyanı zorunludur." }, { status: 400 });

        const database = db.read();
        const user = database.users.find((u: any) => u.email === session.user.email);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        let profile = database.guideProfiles.find(p => p.userId === user.id);

        // Auto-create profile if missing (Migration/Fallback)
        if (!profile) {
            profile = {
                userId: user.id,
                fullName: session.user.name || "Unknown Guide",
                phone: "",
                city: city || "",
                bio: "",
                photo: "",
                isDiyanet: false,
                quotaTarget: 30,
                currentCount: 0,
                isApproved: false,
                credits: 0,
                package: "FREEMIUM",
                tokens: 0
            };
            database.guideProfiles.push(profile);
        }

        // 1. CHECK PACKAGE LIMITS
        const currentListingsCount = database.guideListings.filter(l => l.guideId === user.id && l.active).length;
        if (!PackageSystem.canCreateListing(profile, currentListingsCount)) {
            return NextResponse.json({
                error: "Limit Reached",
                message: "Paket limitinize ulaştınız. Daha fazla tur eklemek için paketinizi yükseltin.",
                code: "LIMIT_REACHED"
            }, { status: 403 });
        }

        // 2. NORMALIZE DATA
        const listingPricing: Pricing = pricing || {
            double: 0,
            triple: 0,
            quad: body.price ? parseFloat(body.price) : 0, // Fallback to old price
            currency: "SAR"
        };
        const basePrice = Math.min(
            listingPricing.quad || Infinity,
            listingPricing.triple || Infinity,
            listingPricing.double || Infinity
        );

        const newListing: GuideListing = {
            id: crypto.randomUUID(),
            guideId: user.id,
            title,
            description: description || "",
            city: city || "",
            departureCity,
            meetingCity: meetingCity || undefined,
            extraServices: Array.isArray(extraServices) ? extraServices : [],
            hotelName: hotelName || undefined,
            airline: airline || "THY", // Default
            pricing: listingPricing,
            price: basePrice === Infinity ? 0 : basePrice,
            quota: quota ? parseInt(quota) : 30,
            filled: 0,
            active: true,
            isFeatured: false, // Default false, admin/package logic can enable later
            startDate: startDate || new Date().toISOString().split('T')[0],
            endDate: endDate || new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
            totalDays: totalDays ? parseInt(totalDays) : 10,
            // Phase 10
            tourPlan: tourPlan || [],
            posterImages: posterImages || [],
            approvalStatus: 'PENDING',
            urgencyTag: urgencyTag || "",
            legalConsent: !!legalConsent,
            consentTimestamp: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        database.guideListings.push(newListing);
        db.write(database);

        return NextResponse.json({
            success: true,
            listing: newListing,
            message: "İlanınız kontrol ediliyor."
        }, { status: 201 });

    } catch (error) {
        console.error("Create listing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
