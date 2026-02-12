import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Server-side ADMIN role guard — no client-side trust
    if (!session?.user?.email || session.user.role !== "ADMIN") {
        redirect("/");
    }

    return <>{children}</>;
}
