
import { GuidePackage, GuideProfile } from "./db";

export const PACKAGES: Record<GuidePackage, {
    maxListings: number;
    listingDurationDays: number;
    maxRequestsResponse: number | "UNLIMITED";
    posterQuality: "LOW" | "NORMAL" | "HIGH";
    watermark: boolean;
    phoneVisible: boolean;
    featuredEligible: boolean;
    priorityRanking: boolean;
    trustBoost: boolean;
    aiGenerator: boolean;
    initialTokens: number;
}> = {
    FREEMIUM: {
        maxListings: 1,
        listingDurationDays: 30,
        maxRequestsResponse: 3,
        posterQuality: "LOW",
        watermark: true,
        phoneVisible: false,
        featuredEligible: false,
        priorityRanking: false,
        trustBoost: false,
        aiGenerator: false,
        initialTokens: 0
    },
    PREMIUM: {
        maxListings: 5,
        listingDurationDays: 365, // effectively unlimited or long term
        maxRequestsResponse: "UNLIMITED",
        posterQuality: "NORMAL",
        watermark: false,
        phoneVisible: true,
        featuredEligible: true,
        priorityRanking: false,
        trustBoost: false,
        aiGenerator: false,
        initialTokens: 50
    },
    PROFESSIONAL: {
        maxListings: 15,
        listingDurationDays: 365,
        maxRequestsResponse: "UNLIMITED",
        posterQuality: "HIGH",
        watermark: false,
        phoneVisible: true,
        featuredEligible: true,
        priorityRanking: true,
        trustBoost: true,
        aiGenerator: false,
        initialTokens: 200
    },
    LEGEND: {
        maxListings: 1000,
        listingDurationDays: 3650,
        maxRequestsResponse: "UNLIMITED",
        posterQuality: "HIGH",
        watermark: false,
        phoneVisible: true,
        featuredEligible: true,
        priorityRanking: true,
        trustBoost: true,
        aiGenerator: true,
        initialTokens: 1000
    }
};

export class PackageSystem {
    static getLimits(pkg: GuidePackage) {
        return PACKAGES[pkg] || PACKAGES.FREEMIUM;
    }

    static canCreateListing(profile: GuideProfile, currentListingCount: number): boolean {
        const limits = this.getLimits(profile.package);
        return currentListingCount < limits.maxListings;
    }

    static isPhoneVisible(profile: GuideProfile): boolean {
        return this.getLimits(profile.package).phoneVisible;
    }

    static getPosterQuality(pkg: GuidePackage) {
        return this.getLimits(pkg).posterQuality;
    }
}
