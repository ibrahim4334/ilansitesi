
/**
 * Profanity filter with production-grade normalization.
 *
 * Normalization pipeline (in order):
 *  1. NFC  — canonical composition
 *  2. NFD  — decompose, strip all combining marks (diacritics)
 *  3. NFC  — recompose clean chars
 *  4. Repeated-char collapse: "siiikkk" → "sik", "fuuuck" → "fuk"
 *  5. Lowercase
 *
 * This defeats common evasion techniques:
 *  - Accented chars:  "şİktîr" → "siktir"
 *  - Repeated chars:  "siiikktttiirr" → "sikitr"
 *  - Mixed case:      "FuCk" → "fuck"
 *  - Unicode clones:  Cyrillic, look-alike letters (stripped by combining mark removal)
 */

// BANNED list stores already-normalized forms (no diacritics, lowercase)
const BANNED_WORDS: string[] = [
    // Turkish
    "orospu", "amk", "siktir", "sik", "yarak", "oc", "pic", "kahpe", "yavsak", "got", "meme",
    // English
    "fuck", "shit", "bitch", "ashole", "dick", "pusi", "whore", "slut", "bastard",
];

/**
 * Normalizes text for comparison against the banned list.
 * Does NOT mutate the stored message body — call this only for check purposes.
 */
export function normalizeText(text: string): string {
    return text
        // 1. NFC: resolve composed sequences first
        .normalize("NFC")
        // 2. Decompose to NFD so combining marks become separate code points
        .normalize("NFD")
        // 3. Strip all Unicode combining marks (Category M: Mn, Mc, Me)
        .replace(/\p{M}/gu, "")
        // 4. Recompose
        .normalize("NFC")
        // 5. Collapse consecutive identical characters to one
        //    "siiikktttiirr" → "sikitr"   "fuuuck" → "fuk"
        .replace(/(.)\1+/gu, "$1")
        // 6. Lowercase
        .toLowerCase()
        .trim();
}

/**
 * Returns true if `text` contains any banned word after normalization.
 * Uses substring match (not word-boundary) so embedded words are caught:
 * e.g. "myfuckingday" → matched.
 */
export function containsProfanity(text: string): boolean {
    const normalized = normalizeText(text);
    return BANNED_WORDS.some(banned => normalized.includes(banned));
}
