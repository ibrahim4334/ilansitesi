
"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Facebook, Mail, User, Map, Building2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { PasswordInput } from "@/components/auth/password-input"
import { cn } from "@/lib/utils"

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("login")

    // Login State
    const [loginEmail, setLoginEmail] = useState("")
    const [loginPassword, setLoginPassword] = useState("")

    // Register State
    const [regName, setRegName] = useState("")
    const [regEmail, setRegEmail] = useState("")
    const [regPhone, setRegPhone] = useState("")
    const [regPassword, setRegPassword] = useState("")
    const [regConfirmPassword, setRegConfirmPassword] = useState("")
    const [regRole, setRegRole] = useState<"USER" | "GUIDE" | "ORGANIZATION">("USER")

    const handleSocialLogin = (provider: string) => {
        signIn(provider, { callbackUrl: "/dashboard" })
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await signIn("credentials", {
                email: loginEmail,
                password: loginPassword,
                redirect: false,
            })

            if (res?.error) {
                toast.error("Giriş yapılamadı. E-posta veya şifre hatalı.")
            } else {
                toast.success("Giriş başarılı!")
                router.push("/dashboard")
                router.refresh()
            }
        } catch (error) {
            toast.error("Bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()

        if (regPassword !== regConfirmPassword) {
            toast.error("Şifreler eşleşmiyor")
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: regName,
                    email: regEmail,
                    phone: regPhone,
                    password: regPassword,
                    role: regRole
                })
            })

            const data = await res.json()

            if (!res.ok) {
                console.error("Registration failed:", data);
                toast.error(data.error || "Kayıt başarısız")
                if (data.details) {
                    console.error("Error details:", data.details);
                }
            } else {
                toast.success("Kayıt başarılı! Doğrulama kodu gönderildi.")
                // Redirect to verify page with email
                router.push(`/auth/verify?email=${encodeURIComponent(regEmail)}`)
            }
        } catch (error) {
            console.error("Registration error:", error);
            toast.error("Bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    const roles = [
        { id: "USER", title: "Umreci", icon: User },
        { id: "GUIDE", title: "Rehber", icon: Map },
        { id: "ORGANIZATION", title: "Kurumsal", icon: Building2 }
    ]

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50 px-4 py-10 dark:bg-gray-950">
            <Card className="w-full max-w-lg shadow-lg border-muted/40">
                <CardHeader className="text-center space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">Umrebuldum</CardTitle>
                    <CardDescription>
                        Manevi yolculuğunuza buradan başlayın
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="login">Giriş Yap</TabsTrigger>
                            <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
                        </TabsList>

                        {/* LOGIN TAB */}
                        <TabsContent value="login" className="space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                <Button variant="outline" onClick={() => handleSocialLogin('google')} className="w-full">
                                    <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                                    <span className="sr-only">Google</span>
                                </Button>
                                <Button variant="outline" onClick={() => handleSocialLogin('apple')} className="w-full">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.127 3.675-.552 9.127 1.519 12.153 1.015 1.481 2.228 3.143 3.82 3.083 1.53-.059 2.106-.989 3.96-.989 1.849 0 2.373.989 3.993.957 1.666-.027 2.723-1.509 3.738-2.992 1.171-1.71 1.652-3.376 1.666-3.456-.035-.018-3.226-1.24-3.268-4.918-.041-3.076 2.508-4.544 2.637-4.634-1.44-2.112-3.69-2.355-4.48-2.39-1.025-.045-1.875.25-2.665.213zM15.545 4.387c.792-1.096 1.957-1.745 1.957-1.745a5.524 5.524 0 0 0-1.442-3.35 5.254 5.254 0 0 0-3.39 1.83 5.378 5.378 0 0 0 1.465 3.393 4.964 4.964 0 0 0 3.385-1.761 1.144 1.144 0 0 0-.014-.029.043.043 0 0 0 .04-.04v.003-.003.002-.002.003.111z" />
                                    </svg>
                                    <span className="sr-only">Apple</span>
                                </Button>
                                <Button variant="outline" onClick={() => handleSocialLogin('facebook')} className="w-full">
                                    <Facebook className="h-4 w-4 text-[#1877F2]" />
                                    <span className="sr-only">Facebook</span>
                                </Button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-gray-50 px-2 text-muted-foreground dark:bg-gray-950">
                                        veya e-posta ile
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-posta</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="ornek@email.com"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Şifre</Label>
                                    <PasswordInput
                                        id="password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* REGISTER TAB */}
                        <TabsContent value="register" className="space-y-4">
                            <form onSubmit={handleRegister} className="space-y-4">
                                {/* Role Selection */}
                                <div className="grid grid-cols-3 gap-2">
                                    {roles.map((role) => {
                                        const Icon = role.icon
                                        const isSelected = regRole === role.id
                                        return (
                                            <div
                                                key={role.id}
                                                className={cn(
                                                    "cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted/50",
                                                    isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-muted"
                                                )}
                                                onClick={() => setRegRole(role.id as any)}
                                            >
                                                <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                                                <span className={cn("text-xs font-medium", isSelected ? "text-primary" : "text-muted-foreground")}>
                                                    {role.title}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Ad Soyad</Label>
                                        <Input
                                            id="name"
                                            placeholder="Adınız Soyadınız"
                                            value={regName}
                                            onChange={(e) => setRegName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Telefon</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="5XX XXX XX XX"
                                            value={regPhone}
                                            onChange={(e) => setRegPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reg-email">E-posta</Label>
                                    <Input
                                        id="reg-email"
                                        type="email"
                                        placeholder="ornek@email.com"
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reg-password">Şifre</Label>
                                    <PasswordInput
                                        id="reg-password"
                                        showStrength
                                        value={regPassword}
                                        onChange={(e) => setRegPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Şifre Tekrar</Label>
                                    <PasswordInput
                                        id="confirm-password"
                                        value={regConfirmPassword}
                                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Kaydediliyor..." : "Kayıt Ol"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
