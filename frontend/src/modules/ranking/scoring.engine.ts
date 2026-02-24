// ─── Scoring Engine ─────────────────────────────────────────────────────
// Re-export from the ranking module for clean imports.
// Original implementation in lib/listing-ranking.ts.
// This module wraps it with Clean Architecture conventions.

export {
    scoreGuideListing,
    scoreCorporateListing,
    calculateListingScore,
    calculateProfileCompleteness,
} from "@/lib/listing-ranking";
