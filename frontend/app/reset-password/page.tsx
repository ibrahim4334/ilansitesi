"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        if (!token || !email) {
            toast.error("Geçersiz veya eksik bağlantı.");
            // router.push("/forgot-password"); // Commented out to prevent redirect loop during static gen check if params missing
        }
    }, [token, email, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Şifreler eşleşmiyor.");
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error("Şifre en az 6 karakter olmalıdır.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    email,
                    newPassword: formData.newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Şifre sıfırlanamadı.");
            }

            toast.success("Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.");
            router.push("/login");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!token || !email) {
        return <div className="text-center py-4">Geçersiz bağlantı.</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="newPassword">Yeni Şifre</Label>
                <Input
                    id="newPassword"
                    type="password"
                    placeholder="******"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    required
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="******"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Şifreyi Güncelle
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-2xl font-bold mb-6">Yeni Şifre Belirle</h1>
                <Suspense fallback={<div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
