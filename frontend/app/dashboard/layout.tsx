import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Server-side guard: must be authenticated with a valid role
    if (!session?.user?.email) {
        redirect("/login");
    }

    const role = session.user.role;

    // ADMIN should be at /admin/dashboard, not here
    if (role === "ADMIN") {
        redirect("/admin/dashboard");
    }

    // If no role, send to onboarding
    if (!role) {
        redirect("/onboarding");
    }

    // Valid roles: USER, GUIDE, ORGANIZATION
    if (!["USER", "GUIDE", "ORGANIZATION"].includes(role)) {
        redirect("/");
    }

    return <>{children}</>;
}
