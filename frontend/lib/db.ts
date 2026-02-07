
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export type GuidePackage = "FREEMIUM" | "PREMIUM" | "PROFESSIONAL" | "LEGEND";

export interface GuideProfile {
    userId: string;
    fullName: string;
    phone: string;
    city: string;
    bio?: string;
    photo?: string;
    isDiyanet?: boolean;
    quotaTarget: number;
    currentCount: number;
    isApproved: boolean;
    credits: number;
    trustScore?: number; // default 50
    completedTrips?: number; // default 0
    package: GuidePackage; // default FREEMIUM
    packageExpiry?: string;
    tokens: number; // For viewing requests/chats
}

export interface Pricing {
    double: number;
    triple: number;
    quad: number;
    currency: "SAR";
}

export interface TourDay {
    day: number;
    city: "Mekke" | "Medine" | "Cidde" | "Diğer";
    title: string;
    description: string;
}

export interface GuideListing {
    id: string;
    guideId: string;
    title: string;
    description: string;
    city: string; // Target city in SA or base
    departureCity: string; // Normalized from list
    meetingCity?: string;
    extraServices: string[];
    hotelName?: string;
    airline?: string; // Normalized
    pricing: Pricing; // Replaces 'price'
    price: number; // KEEP FOR BACKWARD COMPAT (lowest price)
    quota: number;
    filled: number;
    active: boolean;
    isFeatured?: boolean;
    startDate: string;
    endDate: string;
    totalDays: number;
    // Phase 10 Fields
    tourPlan?: TourDay[];
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    urgencyTag?: string; // 'SON_FIRSAT', 'SINIRLI_KONTENJAN', etc.
    legalConsent: boolean;
    consentTimestamp?: string;
    createdAt?: string; // For sorting
}

export interface UmrahRequest {
    id: string;
    userEmail: string;
    departureCity: string;
    peopleCount: number;
    dateRange: string;
    roomType: "2-kisilik" | "3-kisilik" | "4-kisilik";
    budget?: number; // In SAR
    note?: string;
    createdAt: string;
    status: "open" | "closed";
}

export interface RequestInterest {
    requestId: string;
    guideEmail: string;
    createdAt: string;
}

export interface DatabaseSchema {
    users: any[];
    sessions: any[];
    accounts: any[];
    verificationTokens: any[];
    guideProfiles: GuideProfile[];
    guideListings: GuideListing[];
    umrahRequests: UmrahRequest[];
    requestInterests: RequestInterest[];
    chatThreads: ChatThread[];
    chatMessages: ChatMessage[];
    creditPackages: CreditPackage[];
    transactions: Transaction[];
}

export interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    priceTRY: number;
}

export interface Transaction {
    id: string;
    userId: string;
    role: string;
    credits: number;
    amountTRY: number;
    provider: "stripe";
    status: "pending" | "completed";
    sessionId?: string; // Stripe Session ID
    createdAt: string;
}

export interface ChatThread {
    id: string;
    requestId: string;
    userEmail: string;
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

function getDb(): DatabaseSchema {
    if (!fs.existsSync(DB_PATH)) {
        return {
            users: [],
            sessions: [],
            accounts: [],
            verificationTokens: [],
            guideProfiles: [],
            guideListings: [],
            umrahRequests: [],
            requestInterests: [],
            chatThreads: [],
            chatMessages: [],
            creditPackages: [],
            transactions: []
        };
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(data);

    // Ensure arrays exist
    if (!db.guideProfiles) db.guideProfiles = [];
    if (!db.guideListings) db.guideListings = [];
    if (!db.umrahRequests) db.umrahRequests = [];
    if (!db.requestInterests) db.requestInterests = [];
    if (!db.chatThreads) db.chatThreads = [];
    if (!db.chatMessages) db.chatMessages = [];
    if (!db.creditPackages) db.creditPackages = [];
    if (!db.transactions) db.transactions = [];

    // Seed Packages if empty
    if (db.creditPackages.length === 0) {
        db.creditPackages = [
            { id: "pkg_starter", name: "Başlangıç Paketi", credits: 10, priceTRY: 299 },
            { id: "pkg_pro", name: "Pro Paket", credits: 30, priceTRY: 799 },
            { id: "pkg_agency", name: "Ajans Paketi", credits: 100, priceTRY: 1999 }
        ];
    }

    return db;
}

function saveDb(db: DatabaseSchema) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export const db = {
    read: getDb,
    write: saveDb
};
