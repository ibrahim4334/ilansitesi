import { prisma } from "@/lib/prisma";
import { Review } from "../domain/Review";
import { ReviewPolicy } from "../domain/ReviewPolicy";
import { Sanitizer } from "../infrastructure/utils/Sanitizer";
import { ProfanityFilter } from "../infrastructure/utils/ProfanityFilter";
import { ReviewRepository } from "../infrastructure/ReviewRepository";
import { HashUtil } from "../infrastructure/utils/HashUtil";
import { checkReviewIntegrity } from "./ReviewIntegrityEngine";

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

        // 2. Prevent self-review (Anti-Sybil Hard Block)
        if (req.guideId === req.reviewerUserId) {
            throw new Error("Kendi profilinizi değerlendiremezsiniz."); // Self-review block
        }

        // 3. Fetch Interaction data (UmrahRequest and Offer and Conversation)
        const demand = await prisma.umrahRequest.findUnique({
            where: { id: req.requestId },
            include: {
                conversations: {
                    where: { guideId: req.guideId },
                    include: { messages: { take: 1 } },
                },
            },
        });

        if (!demand) {
            throw new Error("Talebiniz bulunamadı.");
        }
        if (demand.userEmail && req.reviewerUserId) {
            // Note: the schema defines userEmail on UmrahRequest.
            // Ensure the reviewer is the one who created the request.
            const user = await prisma.user.findUnique({ where: { id: req.reviewerUserId } });
            if (demand.userEmail !== user?.email) {
                throw new Error("Yalnızca kendi talebiniz için değerlendirme yapabilirsiniz.");
            }
        }

        const hasConversation = demand.conversations.length > 0 && demand.conversations[0].messages.length > 0;

        // P1 Requirement: Booking/Assignment verification
        // Status must be closed/completed (meaning user picked a guide)
        const isRequestClosed = demand.status === "closed" || demand.status === "completed";

        if (!hasConversation) {
            throw new Error("Yalnızca mesajlaştığınız rehberleri değerlendirebilirsiniz.");
        }

        if (!isRequestClosed) {
            throw new Error("Değerlendirme yapabilmek için anlaşmanın tamamlanması gereklidir.");
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

        // 5. Run integrity engine (replaces manual flag checks)
        const integrityResult = await checkReviewIntegrity(
            req.guideId,
            req.reviewerUserId,
            cleanComment,
            isExtreme,
            hasProfanity,
        );

        // 6. Create Entity
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

        // 7. Apply integrity decision
        if (integrityResult.action === "AUTO_REJECT") {
            review.reject();
            console.warn(`[Review] Auto-rejected: ${integrityResult.flags.join(", ")}`);
        } else if (integrityResult.action === "QUEUE_FOR_REVIEW") {
            review.markAsPending();
            if (hasProfanity) {
                console.warn(`[Review] Profanity detected for Request ID: ${req.requestId}`);
            }
            if (integrityResult.flags.includes("SIMILAR_REVIEW")) {
                console.warn(`[Review] Similar review detected (score: ${integrityResult.similarityScore})`);
            }
        } else {
            review.approve();
        }

        // 8. Persist
        await this.repo.save(review);
    }
}
