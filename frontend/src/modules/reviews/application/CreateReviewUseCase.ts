import prisma from "@/lib/prisma";
import { Review } from "../domain/Review";
import { ReviewPolicy } from "../domain/ReviewPolicy";
import { Sanitizer } from "../infrastructure/utils/Sanitizer";
import { ProfanityFilter } from "../infrastructure/utils/ProfanityFilter";
import { ReviewRepository } from "../infrastructure/ReviewRepository";
import { HashUtil } from "../infrastructure/utils/HashUtil";

interface CreateReviewRequest {
    guideId: string;
    reviewerUserId: string;
    requestId: string;
    ratingCommunication: number;
    ratingKnowledge: number;
    ratingOrganization: number;
    ratingTimeManagement: number;
    positiveTags: string[];
    negativeTags: string[];
    comment?: string;
    ipAddress?: string;
    userAgent?: string;
}

export class CreateReviewUseCase {
    constructor(private repo: ReviewRepository) { }

    public async execute(req: CreateReviewRequest): Promise<void> {
        // 1. Validation Logic
        ReviewPolicy.validateRatings(
            req.ratingCommunication,
            req.ratingKnowledge,
            req.ratingOrganization,
            req.ratingTimeManagement
        );
        ReviewPolicy.validateTags(req.positiveTags ?? [], req.negativeTags ?? []);

        // 2. Fetch Interaction data (UmrahRequest and Offer and Conversation)
        const demand = await prisma.demand.findUnique({
            where: { id: req.requestId },
            include: {
                offers: {
                    where: { guideId: req.guideId },
                },
                conversations: {
                    where: { guideId: req.guideId },
                    include: { messages: { take: 1 } },
                },
            },
        });

        if (!demand) {
            throw new Error("Talebiniz bulunamadı.");
        }
        if (demand.createdBy !== req.reviewerUserId) {
            throw new Error("Yalnızca kendi talebiniz için değerlendirme yapabilirsiniz.");
        }

        const hasOffer = demand.offers.length > 0;
        const hasConversation = demand.conversations.length > 0 && demand.conversations[0].messages.length > 0;

        // A user can review a guide ONLY IF: They created a request, the guide sent an offer, there was a message exchange
        if (!hasOffer || !hasConversation) {
            throw new Error("Yalnızca teklif aldığınız ve mesajlaştığınız rehberleri değerlendirebilirsiniz.");
        }

        // Check if review already exists
        const existingReview = await this.repo.findByRequestIdAndUserId(req.requestId, req.reviewerUserId);
        if (existingReview) {
            throw new Error("Bu talep için zaten bir değerlendirme yaptınız.");
        }

        // 3. Abuse Protection
        const ipHash = HashUtil.hash(req.ipAddress);
        const userAgentHash = HashUtil.hash(req.userAgent);

        const counts = await this.repo.getDuplicateCount(req.guideId, ipHash, req.reviewerUserId);
        if (counts.globalCount >= 3) {
            throw new Error("Too many requests from this IP. Please try again later."); // 429
        }
        if (counts.dailyCount >= 5) {
            throw new Error("Günde en fazla 5 değerlendirme yapabilirsiniz.");
        }
        if (counts.thisGuideCount >= 1) {
            throw new Error("Aynı rehberi 30 gün içinde yalnızca bir kez değerlendirebilirsiniz.");
        }

        // 4. Sanitize and Filter
        const cleanComment = Sanitizer.sanitizeReviewText(req.comment);
        const hasProfanity = ProfanityFilter.containsProfanity(cleanComment);
        const isExtreme = ReviewPolicy.isSuspiciousRatingExtreme(
            req.ratingCommunication,
            req.ratingKnowledge,
            req.ratingOrganization,
            req.ratingTimeManagement
        );

        let ipRiskHigh = false;
        if (ipHash) {
            const distinctUsersFromIP = await this.repo.findPendingIPMatches(req.guideId, ipHash);
            if (distinctUsersFromIP >= 3) {
                ipRiskHigh = true;
            }
        }

        // 5. Create Entity
        const review = Review.create({
            guideId: req.guideId,
            reviewerUserId: req.reviewerUserId,
            requestId: req.requestId,
            ratingCommunication: req.ratingCommunication,
            ratingKnowledge: req.ratingKnowledge,
            ratingOrganization: req.ratingOrganization,
            ratingTimeManagement: req.ratingTimeManagement,
            positiveTags: req.positiveTags || [],
            negativeTags: req.negativeTags || [],
            comment: cleanComment,
            ipHash,
            userAgentHash,
        });

        if (hasProfanity || isExtreme || ipRiskHigh) {
            review.markAsPending();
            if (hasProfanity) {
                // Here we could notify admin via an event or email...
                console.warn(`[Review] Profanity detected for Request ID: ${req.requestId}`);
            }
        } else {
            review.approve();
        }

        // 6. Persist
        await this.repo.save(review);
    }
}
