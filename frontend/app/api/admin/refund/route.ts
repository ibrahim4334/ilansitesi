import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";
import { PaymentService } from "@/lib/payment-service";

export async function POST(req: Request) {
    try {
        const session = await auth();
        const guard = requireAdmin(session);
        if (guard) return guard;

        const { transactionId, reason } = await req.json();

        if (!transactionId || !reason) {
            return NextResponse.json({ error: "Missing transactionId or reason" }, { status: 400 });
        }

        const adminId = session!.user.id!;

        await PaymentService.refund(transactionId, adminId, reason);

        return NextResponse.json({
            success: true,
            message: `Transaction ${transactionId} refunded successfully`
        });

    } catch (error: any) {
        console.error("Admin refund error:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
