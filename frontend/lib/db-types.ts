// ─── Type Compatibility Layer ───────────────────────────────────────────
// Re-exports types for client components.
// These match API response shapes (not raw Prisma models).

// ── Roles & Packages ────────────────────────────────────────────────────

export type UserRole = "FREEMIUM" | "GUIDE" | "CORPORATE" | "ADMIN" | "BANNED";

export type PackageType =
    | "FREE" | "STARTER" | "PRO" | "LEGEND"
    | "CORP_BASIC" | "CORP_PRO" | "CORP_ENTERPRISE";

export type ListingType = "GUIDE_PROFILE" | "CORPORATE_TOUR";
export type ListingStatus = "ACTIVE" | "EXPIRED" | "ARCHIVED" | "PENDING" | "REJECTED";
export type DemandStatus = "OPEN" | "CLOSED" | "EXPIRED" | "DELETED";
export type OfferStatus = "pending" | "accepted" | "rejected" | "expired";
export type TokenType = "OFFER_SEND" | "DEMAND_UNLOCK" | "BOOST" | "REPUBLISH" | "PURCHASE" | "REFUND" | "ADMIN_GRANT" | "SUBSCRIPTION";

// ── Data Interfaces ─────────────────────────────────────────────────────

export interface Pricing {
    double: number;
    triple: number;
    quad: number;
    currency: "SAR";
}

export interface TourDay {
    day: number;
    city: string;
    title: string;
    description: string;
}

export interface Listing {
    id: string;
    ownerId: string;
    type: ListingType;
    status: ListingStatus;
    title: string;
    description: string;
    city: string;
    departureCity?: string | null;
    meetingCity?: string | null;
    extraServices: string[];
    hotelName?: string | null;
    airline?: string | null;
    pricing: Pricing;
    price: number;
    quota: number;
    filled: number;
    isFeatured?: boolean;
    boostScore?: number;
    startDate: string;
    endDate: string;
    expiresAt: string;
    totalDays: number;
    tourPlan?: TourDay[];
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason?: string | null;
    urgencyTag?: string | null;
    legalConsent: boolean;
    consentTimestamp?: string | null;
    image?: string | null;
    createdAt?: string;
    guide?: UserProfile | null;
}

export interface Demand {
    id: string;
    createdBy: string;
    departureCity: string;
    peopleCount: number;
    dateRange: string;
    roomType: string;
    budget?: number | null;
    note?: string | null;
    status: DemandStatus;
    expiresAt: string;
    createdAt: string;
}

export interface Offer {
    id: string;
    demandId: string;
    guideId: string;
    price: number;
    currency: string;
    message?: string | null;
    status: OfferStatus;
    expiresAt: string;
    createdAt: string;
}

export interface TokenTransaction {
    id: string;
    userId: string;
    type: TokenType;
    amount: number;
    reason: string;
    relatedId?: string | null;
    createdAt: string;
}

export interface UserProfile {
    id: string;
    fullName?: string | null;
    phone?: string | null;
    city?: string | null;
    bio?: string | null;
    photo?: string | null;
    isDiyanetVerified: boolean;
    trustScore: number;
    completedTrips: number;
    role: UserRole;
    packageType: PackageType;
    tokenBalance: number;
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderRole: "USER" | "GUIDE" | "CORPORATE";
    message: string;
    createdAt: string;
}
