import DOMPurify from "isomorphic-dompurify";

export class Sanitizer {
    public static sanitizeReviewText(input: string | null | undefined): string | null {
        if (!input) return null;

        // 1. Strip HTML
        let cleanText = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });

        // 2. Remove phone numbers
        // Note: Replaced \s with \s to avoid TS escape sequence issues 
        // Just using standard regex for 10 or more digits
        cleanText = cleanText.replace(/(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g, "[PHONE REMOVED]");
        cleanText = cleanText.replace(/\b\d{10,13}\b/g, "[PHONE REMOVED]");

        // 3. Remove email patterns
        cleanText = cleanText.replace(/([a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9._-]+)/g, "[EMAIL REMOVED]");

        // 4. Remove Links/URLs
        cleanText = cleanText.replace(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g, "[LINK REMOVED]");
        cleanText = cleanText.replace(/www\.[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g, "[LINK REMOVED]");

        // 5. Truncate to max 500 characters
        if (cleanText.length > 500) {
            cleanText = cleanText.substring(0, 500);
        }

        return cleanText.trim();
    }
}
