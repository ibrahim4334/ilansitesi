import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GuideOnboardingPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <h1 className="text-3xl font-bold mb-4">Rehber Paneli & Kurulum</h1>
            <p className="text-muted-foreground mb-8">Profil ayarları ve rehberlik araçları yakında burada olacak.</p>

            <Button asChild>
                <Link href="/">Ana Sayfaya Dön</Link>
            </Button>
        </div>
    );
}
