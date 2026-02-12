// Type compatibility layer
// Re-exports types for client components that previously imported from lib/db.ts
// These match the shapes returned by API routes (not raw Prisma models)

export type GuidePackage = "FREEMIUM" | "PREMIUM" | "PROFESSIONAL" | "LEGEND";

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

export interface GuideListing {
    id: string;
    guideId: string;
    title: string;
    description: string;
    city: string;
    departureCity: string;
    meetingCity?: string | null;
    extraServices: string[];
    hotelName?: string | null;
    airline?: string | null;
    pricing: Pricing;
    price: number;
    quota: number;
    filled: number;
    active: boolean;
    isFeatured?: boolean;
    startDate: string;
    endDate: string;
    totalDays: number;
    tourPlan?: TourDay[];
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason?: string | null;
    urgencyTag?: string | null;
    legalConsent: boolean;
    consentTimestamp?: string | null;
    image?: string | null;
    createdAt?: string;
}

export interface UmrahRequest {
    id: string;
    userEmail: string;
    departureCity: string;
    peopleCount: number;
    dateRange: string;
    roomType: "2-kisilik" | "3-kisilik" | "4-kisilik";
    budget?: number | null;
    note?: string | null;
    createdAt: string;
    status: "open" | "closed";
}

export interface RequestInterest {
    requestId: string;
    guideEmail: string;
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    threadId: string;
    senderRole: "USER" | "GUIDE" | "ORGANIZATION";
    message: string;
    createdAt: string;
}

export interface GuideProfile {
    userId: string;
    fullName: string;
    phone: string;
    city: string;
    bio?: string | null;
    photo?: string | null;
    isDiyanet?: boolean;
    quotaTarget: number;
    currentCount: number;
    isApproved: boolean;
    credits: number;
    trustScore?: number;
    completedTrips?: number;
    package: GuidePackage;
    packageExpiry?: string | null;
    tokens: number;
}
