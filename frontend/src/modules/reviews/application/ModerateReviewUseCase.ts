import prisma from "@/lib/prisma";

export class ModerateReviewUseCase {
    public async execute(reviewId: string, action: "APPROVE" | "REJECT"): Promise<void> {
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!review) {
            throw new Error("Review not found.");
        }

        if (review.status !== "PENDING") {
            throw new Error("Review is not in a PENDING state.");
        }

        if (action === "APPROVE") {
            await prisma.review.update({
                where: { id: reviewId },
                data: {
                    status: "APPROVED",
                    approvedAt: new Date(),
                },
            });
        } else if (action === "REJECT") {
            await prisma.review.update({
                where: { id: reviewId },
                data: {
                    status: "REJECTED",
                    deletedAt: new Date(), // Soft delete rejected reviews
                },
            });
        }
    }
}
