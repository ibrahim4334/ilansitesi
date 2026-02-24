import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ModerateReviewUseCase } from "@/src/modules/reviews/application/ModerateReviewUseCase";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Only ADMIN should access this
        const session = await getServerSession(authOptions);
        if (!session || !session.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const body = await req.json();
        const { action } = body;

        if (!id || (action !== "APPROVE" && action !== "REJECT")) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        const useCase = new ModerateReviewUseCase();
        await useCase.execute(id, action);

        return NextResponse.json({ success: true, message: `Review ${action.toLowerCase()}d successfully.` });
    } catch (error: any) {
        console.error(`[PATCH /api/admin/reviews/${params.id}] Error:`, error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
    }
}
