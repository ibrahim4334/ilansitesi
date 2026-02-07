"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { User, Map, Building2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const roles = [
    {
        id: "USER",
        title: "Umreci",
        description: "Umre ziyareti yapmak istiyorum. Turları inceleyip rezervasyon yapacağım.",
        icon: User
    },
    {
        id: "GUIDE",
        title: "Rehber",
        description: "Umre turlarında rehberlik hizmeti veriyorum. Profil oluşturup turlara katılacağım.",
        icon: Map
    },
    {
        id: "ORGANIZATION",
        title: "Organizasyon",
        description: "Tur şirketiyim. Umre turlarımı yayınlayıp müşteri bulmak istiyorum.",
        icon: Building2
    }
]

export default function OnboardingPage() {
    const { data: session, update, status } = useSession()
    const router = useRouter()
    const [selectedRole, setSelectedRole] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        // Updated check for normalized roles
        const userRole = session?.user?.role;
        const hasValidRole = ["USER", "GUIDE", "ORGANIZATION"].includes(userRole || "");

        if (session?.user?.requires_onboarding === false || hasValidRole) {
            // Redirect based on role if already persistent
            if (userRole === "GUIDE") router.replace("/guide/onboarding");
            else if (userRole === "ORGANIZATION") router.replace("/org/onboarding");
            else router.replace("/");
        }
    }, [session, router])

    // Redirect if not logged in
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }
    }, [status, router])

    // Redirect if already has role (optional, but good UX)
    // useEffect(() => {
    //   if (session?.user?.role) {
    //      router.push("/")
    //   }
    // }, [session, router])

    const handleComplete = async () => {
        if (!selectedRole) return

        setSubmitting(true)
        try {
            const res = await fetch('/api/set-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: selectedRole })
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error("API Error Details:", errData);
                throw new Error(errData.error || 'Profil güncellenemedi');
            }

            // Trigger session update to refresh JWT from server (which now has role from WP/DB if we used it, but here we push it via update trigger logic if needed, OR we rely on re-fetch if backend source of truth changed)
            // But wait, our set-role API updated the backend. 
            // The NEXT_AUTH update below is still useful for immediate client-side reflection if we passed data, 
            // BUT to be structurally correct with JWT Strategy as requested:

            await fetch("/api/auth/session?update")

            // We can also call update() to be doubly sure for client hook
            await update({ role: selectedRole, requires_onboarding: false })

            toast.success("Rolünüz seçildi! Yönlendiriliyorsunuz...")

            // Delay slightly for effect
            setTimeout(() => {
                if (selectedRole === "GUIDE") {
                    router.push("/guide/onboarding")
                } else if (selectedRole === "ORGANIZATION") {
                    router.push("/org/onboarding")
                } else {
                    router.push("/")
                }
            }, 1000)

        } catch (error) {
            console.error(error)
            toast.error("Bir hata oluştu. Lütfen tekrar deneyin.")
        } finally {
            setSubmitting(false)
        }
    }

    if (status === "loading") {
        return <div className="flex min-h-screen items-center justify-center">Yükleniyor...</div>
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50/50 p-4 dark:bg-gray-950">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[600px] lg:w-[800px]">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Hesabınızı Seçin
                    </h1>
                    <p className="text-muted-foreground">
                        Size en uygun deneyimi sunabilmemiz için lütfen rolünüzü seçin.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {roles.map((role) => {
                        const Icon = role.icon
                        const isSelected = selectedRole === role.id
                        return (
                            <Card
                                key={role.id}
                                className={cn(
                                    "cursor-pointer transition-all hover:border-primary hover:shadow-md",
                                    isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
                                )}
                                onClick={() => setSelectedRole(role.id)}
                            >
                                <CardHeader className="p-6 pb-2">
                                    <div className="flex items-center justify-between">
                                        <Icon className={cn("h-8 w-8 mb-2", isSelected ? "text-primary" : "text-muted-foreground")} />
                                        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                    </div>
                                    <CardTitle className="text-lg">{role.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 pt-2">
                                    <CardDescription className="text-sm">
                                        {role.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <Button
                    size="lg"
                    className="w-full sm:w-auto self-center px-8"
                    disabled={!selectedRole || submitting}
                    onClick={handleComplete}
                >
                    {submitting ? "Kaydediliyor..." : "Devam Et"}
                </Button>
            </div>
        </div>
    )
}
