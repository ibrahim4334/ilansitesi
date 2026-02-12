
"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"

function VerifyContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const email = searchParams.get("email")

    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code })
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || "Doğrulama başarısız")
            } else {
                toast.success("Hesabınız doğrulandı! Giriş yapabilirsiniz.")
                router.push("/login?verified=true")
            }
        } catch (error) {
            toast.error("Bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    if (!email) {
        return (
            <div className="text-center">
                <p>E-posta adresi bulunamadı.</p>
                <Button variant="link" onClick={() => router.push("/login")}>Giriş Sayfasına Dön</Button>
            </div>
        )
    }

    return (
        <Card className="w-full max-w-md shadow-lg border-muted/40">
            <CardHeader className="text-center space-y-1">
                <div className="flex justify-center mb-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">E-postanızı Doğrulayın</CardTitle>
                <CardDescription>
                    {email} adresine gönderilen 6 haneli kodu giriniz.
                </CardDescription>
                {/* Dev Note: In real app, resend link would go here */}
            </CardHeader>
            <CardContent>
                <form onSubmit={handleVerify} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code" className="sr-only">Doğrulama Kodu</Label>
                        <Input
                            id="code"
                            className="text-center text-2xl tracking-widest"
                            maxLength={6}
                            placeholder="123456"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={loading || code.length < 6}>
                        {loading ? "Doğrulanıyor..." : "Doğrula"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Button variant="link" onClick={() => router.push("/login")} className="text-muted-foreground">
                    Giriş Sayfasına Dön
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function VerifyPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50 px-4 py-10 dark:bg-gray-950">
            <Suspense fallback={<div>Yükleniyor...</div>}>
                <VerifyContent />
            </Suspense>
        </div>
    )
}
