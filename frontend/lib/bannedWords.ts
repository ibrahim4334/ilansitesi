
const BANNED_WORDS = [
    // Turkish
    "orospu", "amk", "siktir", "sik", "yarak", "oç", "piç", "kahpe", "yavşak", "göt", "meme", "am",
    // English
    "fuck", "shit", "bitch", "asshole", "dick", "pussy", "whore", "slut", "bastard"
];

export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/ı/g, "i")
        .replace(/ş/g, "s")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .trim();
}

/**
 * Checks if text contains any banned word.
 * Returns true if blocked.
 */
export function containsProfanity(text: string): boolean {
    const normalized = normalizeText(text);
    const words = normalized.split(/\s+/);

    // Simple containment check (can be improved with regex later)
    for (const word of words) {
        if (BANNED_WORDS.some(banned => word.includes(banned))) {
            return true;
        }
    }
    return false;
}
