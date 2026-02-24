import prisma from "@/lib/prisma";

export interface DashboardReviewStats {
    overallAverage: number;
    totalCount: number;
    breakdown: {
        communication: number;
        knowledge: number;
        organization: number;
        timeManagement: number;
    };
    recentReviews: any[];
}

export class GetGuideReviewsQuery {
    public async execute(guideId: string): Promise<DashboardReviewStats> {
        const approvedReviews = await prisma.review.findMany({
            where: {
                guideId,
                status: "APPROVED",
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                reviewer: {
                    select: {
                        name: true,
                        photo: true,
                    }
                }
            }
        });

        if (approvedReviews.length === 0) {
            return {
                overallAverage: 0,
                totalCount: 0,
                breakdown: { communication: 0, knowledge: 0, organization: 0, timeManagement: 0 },
                recentReviews: [],
            };
        }

        let sumComm = 0;
        let sumKnow = 0;
        let sumOrg = 0;
        let sumTime = 0;
        let sumOverall = 0;

        for (const r of approvedReviews) {
            sumComm += r.ratingCommunication;
            sumKnow += r.ratingKnowledge;
            sumOrg += r.ratingOrganization;
            sumTime += r.ratingTimeManagement;
            sumOverall += Number(r.overallRating);
        }

        const count = approvedReviews.length;

        return {
            totalCount: count,
            overallAverage: Number((sumOverall / count).toFixed(1)),
            breakdown: {
                communication: Number((sumComm / count).toFixed(1)),
                knowledge: Number((sumKnow / count).toFixed(1)),
                organization: Number((sumOrg / count).toFixed(1)),
                timeManagement: Number((sumTime / count).toFixed(1)),
            },
            recentReviews: approvedReviews.slice(0, 5).map(r => ({
                id: r.id,
                reviewerName: r.reviewer?.name || "Anonim Kullanıcı",
                reviewerPhoto: r.reviewer?.photo || null,
                overallRating: Number(r.overallRating),
                comment: r.comment,
                createdAt: r.createdAt,
                positiveTags: typeof r.positiveTags === "string" ? JSON.parse(r.positiveTags) : r.positiveTags,
                negativeTags: typeof r.negativeTags === "string" ? JSON.parse(r.negativeTags) : r.negativeTags,
            })),
        };
    }
}
