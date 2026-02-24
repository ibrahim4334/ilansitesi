import prisma from "@/lib/prisma";
import { Review } from "../domain/Review";

export class ReviewRepository {
    public async save(review: Review): Promise<void> {
        const data = {
            id: review.id,
            guideId: review.guideId,
            reviewerUserId: review.reviewerUserId,
            requestId: review.requestId,
            ratingCommunication: review.ratingCommunication,
            ratingKnowledge: review.ratingKnowledge,
            ratingOrganization: review.ratingOrganization,
            ratingTimeManagement: review.ratingTimeManagement,
            overallRating: review.overallRating,
            positiveTags: JSON.stringify(review.positiveTags),
            negativeTags: JSON.stringify(review.negativeTags),
            comment: review.comment,
            status: review.status,
            isVerified: review.isVerified,
            ipHash: review.ipHash,
            userAgentHash: review.userAgentHash,
            createdAt: review.createdAt,
            approvedAt: review.approvedAt,
            deletedAt: review.deletedAt,
        };

        if (review.id) {
            await prisma.review.update({
                where: { id: review.id },
                data,
            });
        } else {
            const created = await prisma.review.create({ data });
            // In a strict DD setup, we map created.id back if needed, but here we just ensure 
            // the data flows to DB correctly.
        }
    }

    public async getDuplicateCount(guideId: string, ipHash: string | null, userId: string): Promise<{ globalCount: number; dailyCount: number; thisGuideCount: number }> {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [dailyCount, thisGuideCount] = await Promise.all([
            prisma.review.count({
                where: {
                    reviewerUserId: userId,
                    createdAt: { gte: twentyFourHoursAgo },
                },
            }),
            prisma.review.count({
                where: {
                    reviewerUserId: userId,
                    guideId: guideId,
                    createdAt: { gte: thirtyDaysAgo },
                },
            }),
        ]);

        let globalCount = 0;
        if (ipHash) {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            globalCount = await prisma.review.count({
                where: {
                    ipHash,
                    createdAt: { gte: oneHourAgo },
                },
            });
        }

        return { globalCount, dailyCount, thisGuideCount };
    }

    public async findByRequestIdAndUserId(requestId: string, userId: string): Promise<any> {
        return prisma.review.findUnique({
            where: {
                requestId_reviewerUserId: {
                    requestId,
                    reviewerUserId: userId,
                },
            },
        });
    }

    public async findPendingIPMatches(guideId: string, ipHash: string): Promise<number> {
        // If same IP creates 3 different accounts reviewing same guide -> flag
        const matches = await prisma.review.groupBy({
            by: ['reviewerUserId'],
            where: {
                guideId,
                ipHash,
            },
            _count: true,
        });
        return matches.length;
    }
}
