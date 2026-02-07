import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OrgOnboardingPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <h1 className="text-3xl font-bold mb-4">Organizasyon Paneli & Kurulum</h1>
            <p className="text-muted-foreground mb-8">Acente profil ayarları ve tur yönetim araçları yakında burada olacak.</p>

            <Button asChild>
                <Link href="/">Ana Sayfaya Dön</Link>
            </Button>
        </div>
    );
}
