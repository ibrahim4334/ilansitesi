import { Review } from "../domain/Review";
import { ReviewPolicy } from "../domain/ReviewPolicy";

describe("Review Domain Logic", () => {
    it("should calculate overall rating as average of 4 criteria", () => {
        const review = Review.create({
            guideId: "g1",
            reviewerUserId: "u1",
            requestId: "r1",
            ratingCommunication: 5,
            ratingKnowledge: 4,
            ratingOrganization: 3,
            ratingTimeManagement: 4,
            positiveTags: ["Bilgili"],
            negativeTags: [],
        });

        expect(review.overallRating).toBe(4.0);
    });

    it("should be verified true by default", () => {
        const review = Review.create({
            guideId: "g1",
            reviewerUserId: "u1",
            requestId: "r1",
            ratingCommunication: 5,
            ratingKnowledge: 5,
            ratingOrganization: 5,
            ratingTimeManagement: 5,
            positiveTags: ["Sabırlı"],
            negativeTags: [],
        });

        expect(review.isVerified).toBe(true);
        expect(review.status).toBe("APPROVED");
    });
});

describe("ReviewPolicy", () => {
    it("should throw on invalid tag", () => {
        expect(() =>
            ReviewPolicy.validateTags(["Hacker tag"], [])
        ).toThrowError(/Invalid positive tags: Hacker tag/);
    });

    it("should throw on out of bounds rating", () => {
        expect(() =>
            ReviewPolicy.validateRatings(0, 5, 5, 5)
        ).toThrowError(/Rating must be an integer between 1 and 5/);
    });

    it("should identify extreme ratings", () => {
        expect(ReviewPolicy.isSuspiciousRatingExtreme(5, 5, 5, 5)).toBe(true);
        expect(ReviewPolicy.isSuspiciousRatingExtreme(1, 1, 1, 1)).toBe(true);
        expect(ReviewPolicy.isSuspiciousRatingExtreme(1, 5, 1, 1)).toBe(false);
    });
});
