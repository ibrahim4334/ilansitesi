export const BANNED_WORDS = [
    "küfür", "hakaret", "aptal", "gerizekalı", "şerefsiz",
    "lan", "amk", "sik", "piç", "bok", "yavşak", "oç", "mk",
    "dinsiz", "kafir", "akp", "chp", "mhp", "siyaset"
];

export class ProfanityFilter {
    public static containsProfanity(text: string | null | undefined): boolean {
        if (!text) return false;

        const normalizedText = text.toLowerCase();

        for (const word of BANNED_WORDS) {
            // Check if word is included
            // using regex boundary
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            if (regex.test(normalizedText)) {
                return true;
            }
        }

        return false;
    }
}
