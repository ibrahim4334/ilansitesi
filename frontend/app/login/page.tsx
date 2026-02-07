"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Facebook, Mail } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [devLink, setDevLink] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setDevLink(null)
        try {
            const result = await signIn("nodemailer", {
                email,
                callbackUrl: "/dashboard",
                redirect: false
            })
            if (result?.error) {
                toast.error("Giriş linki gönderilemedi. Lütfen tekrar deneyin.")
            } else {
                toast.success("Giriş linki e-posta adresinize gönderildi!")

                // Dev environment: Fetch and show link
                if (process.env.NODE_ENV === "development") {
                    setTimeout(async () => {
                        try {
                            const res = await fetch(`/api/dev-login-link?email=${encodeURIComponent(email)}`)
                            if (res.ok) {
                                const data = await res.json()
                                if (data.url) {
                                    setDevLink(data.url)
                                    toast.info("Geliştirici modu: Giriş linki aşağıda gösterildi.")
                                }
                            }
                        } catch (err) {
                            console.error("Failed to fetch dev link", err)
                        }
                    }, 1000) // Wait a bit for file write
                }
            }
        } catch (error) {
            toast.error("Bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    const handleSocialLogin = (provider: string) => {
        signIn(provider, { callbackUrl: "/dashboard" })
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50 px-4 py-10 dark:bg-gray-950">
            <Card className="w-full max-w-md shadow-lg border-muted/40">
                <CardHeader className="text-center space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">Hoşgeldiniz</CardTitle>
                    <CardDescription>
                        Devam etmek için giriş yapın veya kayıt olun
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleSocialLogin('google')}
                            className="bg-white hover:bg-gray-50 text-gray-900 border-gray-200 dark:bg-gray-950 dark:hover:bg-gray-900 dark:text-gray-100 dark:border-gray-800 cursor-pointer"
                        >
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Google ile devam et
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleSocialLogin('apple')}
                            className="bg-white hover:bg-gray-50 text-gray-900 border-gray-200 dark:bg-gray-950 dark:hover:bg-gray-900 dark:text-gray-100 dark:border-gray-800 cursor-pointer"
                        >
                            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z"></path>
                            </svg>
                            Apple ile devam et
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleSocialLogin('facebook')}
                            className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white border-transparent cursor-pointer"
                        >
                            <Facebook className="mr-2 h-4 w-4" />
                            Facebook ile devam et
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

                    <form onSubmit={handleEmailLogin}>
                        <div className="grid gap-2">
                            <Label htmlFor="email">E-posta Adresi</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="ornek@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <Button className="w-full mt-4 cursor-pointer" type="submit" disabled={loading}>
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    Gönderiliyor...
                                </div>
                            ) : (
                                <>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Giriş Linki Gönder
                                </>
                            )}
                        </Button>
                    </form>

                    {devLink && (
                        <div className="mt-4 p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Geliştirici Giriş Linki:</p>
                            <a
                                href={devLink}
                                className="text-xs break-all text-green-700 dark:text-green-400 hover:underline block"
                            >
                                {devLink}
                            </a>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
                    Hesabınız yoksa, giriş yaptığınızda otomatik olarak oluşturulacaktır.
                </CardFooter>
            </Card>
        </div>
    )
}
