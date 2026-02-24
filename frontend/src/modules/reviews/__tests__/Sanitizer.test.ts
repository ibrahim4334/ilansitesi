import { Sanitizer } from "../infrastructure/utils/Sanitizer";
import { ProfanityFilter } from "../infrastructure/utils/ProfanityFilter";

describe("Sanitizer", () => {
    it("strips HTML tags completely", () => {
        const input = "<script>alert('xss')</script><b>Hello</b>";
        const cleaned = Sanitizer.sanitizeReviewText(input);
        expect(cleaned).toBe("Hello");
    });

    it("removes phone numbers", () => {
        const input = "Beni bu numaradan ara: +90 555 123 45 67.";
        const cleaned = Sanitizer.sanitizeReviewText(input);
        expect(cleaned).toContain("[PHONE REMOVED]");
        expect(cleaned).not.toContain("555");
    });

    it("removes email patterns", () => {
        const input = "Email me at test@example.com for info.";
        const cleaned = Sanitizer.sanitizeReviewText(input);
        expect(cleaned).toContain("[EMAIL REMOVED]");
        expect(cleaned).not.toContain("test@example.com");
    });

    it("removes links", () => {
        const input = "Visit https://malicious.com now";
        const cleaned = Sanitizer.sanitizeReviewText(input);
        expect(cleaned).toContain("[LINK REMOVED]");
        expect(cleaned).not.toContain("malicious.com");
    });

    it("respects 500 char max length limit", () => {
        const longString = "a".repeat(600);
        const cleaned = Sanitizer.sanitizeReviewText(longString);
        expect(cleaned?.length).toBe(500);
    });
});

describe("ProfanityFilter", () => {
    it("detects bad words", () => {
        expect(ProfanityFilter.containsProfanity("Bu rehber çok aptal bence.")).toBe(true);
        expect(ProfanityFilter.containsProfanity("Harika bir organizasyon")).toBe(false);
    });
});
