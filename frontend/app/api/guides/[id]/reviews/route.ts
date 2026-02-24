import { NextRequest, NextResponse } from "next/server";
import { GetGuideReviewsQuery } from "@/src/modules/reviews/application/GetGuideReviewsQuery";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Kılavuz kimliği eksik." }, { status: 400 });
        }

        const query = new GetGuideReviewsQuery();
        const stats = await query.execute(id);

        return NextResponse.json({ success: true, data: stats });
    } catch (error: any) {
        console.error("[GET /api/guides/[id]/reviews] Error:", error);
        return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
    }
}
