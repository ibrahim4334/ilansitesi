import { NextRequest, NextResponse } from "next/server";
import { CreateReviewUseCase } from "@/src/modules/reviews/application/CreateReviewUseCase";
import { ReviewRepository } from "@/src/modules/reviews/infrastructure/ReviewRepository";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Adjust authOptions import based on typical NextAuth usage in this app

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            guideId,
            requestId,
            ratingCommunication,
            ratingKnowledge,
            ratingOrganization,
            ratingTimeManagement,
            positiveTags,
            negativeTags,
            comment
        } = body;

        if (!guideId || !requestId) {
            return NextResponse.json({ error: "Eksik parametreler" }, { status: 400 });
        }

        const ipAddress = req.ip || req.headers.get("x-forwarded-for") || "unknown";
        const userAgent = req.headers.get("user-agent") || "unknown";

        const repo = new ReviewRepository();
        const useCase = new CreateReviewUseCase(repo);

        await useCase.execute({
            guideId,
            reviewerUserId: session.user.id,
            requestId,
            ratingCommunication: Number(ratingCommunication),
            ratingKnowledge: Number(ratingKnowledge),
            ratingOrganization: Number(ratingOrganization),
            ratingTimeManagement: Number(ratingTimeManagement),
            positiveTags: positiveTags || [],
            negativeTags: negativeTags || [],
            comment,
            ipAddress,
            userAgent
        });

        return NextResponse.json({ success: true, message: "Değerlendirmeniz başarıyla oluşturuldu." }, { status: 201 });

    } catch (error: any) {
        console.error("[POST /api/reviews] Error:", error);

        // Check if it's our 429 logic
        if (error.message && error.message.includes("Too many requests from this IP")) {
            return NextResponse.json({ error: error.message }, { status: 429 });
        }

        // Checking if it's forbidden logic
        if (error.message && error.message.includes("Yalnızca kendi talebiniz") || error.message?.includes("Yalnızca teklif aldığınız")) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({ error: error.message || "Internal server error." }, { status: 400 });
    }
}
