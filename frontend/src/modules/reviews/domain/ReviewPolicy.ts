// src/modules/reviews/domain/ReviewPolicy.ts

export const PREDEFINED_POSITIVE_TAGS = [
    "Güler yüzlü",
    "Sabırlı",
    "Bilgili",
    "Dakik",
    "İlgili",
];

export const PREDEFINED_NEGATIVE_TAGS = [
    "Geç kaldı",
    "Eksik bilgi",
    "İletişim zayıf",
    "Organizasyon sorunlu",
];

export class ReviewPolicy {
    public static validateRatings(
        communication: number,
        knowledge: number,
        organization: number,
        timeManagement: number
    ): void {
        const ratings = [communication, knowledge, organization, timeManagement];
        for (const r of ratings) {
            if (r < 1 || r > 5 || !Number.isInteger(r)) {
                throw new Error(`Rating must be an integer between 1 and 5. Received: ${r}`);
            }
        }
    }

    public static validateTags(positiveTags: string[], negativeTags: string[]): void {
        if (positiveTags.length === 0 && negativeTags.length === 0) {
            throw new Error("Must select at least one tag (positive or negative).");
        }

        const invalidPositives = positiveTags.filter((pt) => !PREDEFINED_POSITIVE_TAGS.includes(pt));
        if (invalidPositives.length > 0) {
            throw new Error(`Invalid positive tags: ${invalidPositives.join(", ")}`);
        }

        const invalidNegatives = negativeTags.filter((nt) => !PREDEFINED_NEGATIVE_TAGS.includes(nt));
        if (invalidNegatives.length > 0) {
            throw new Error(`Invalid negative tags: ${invalidNegatives.join(", ")}`);
        }
    }

    public static isSuspiciousRatingExtreme(
        communication: number,
        knowledge: number,
        organization: number,
        timeManagement: number
    ): boolean {
        const ratings = [communication, knowledge, organization, timeManagement];
        const allOnes = ratings.every((r) => r === 1);
        const allFives = ratings.every((r) => r === 5);
        return allOnes || allFives;
    }
}
