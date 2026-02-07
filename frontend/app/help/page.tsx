import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
    title: "Yardım Merkezi | Umrebuldum",
    description: "Yardıma mı ihtiyacınız var? Sıkça sorulan sorulara göz atın veya bizimle iletişime geçin.",
}

export default function HelpPage() {
    return (
        <div className="container py-12 md:py-16 lg:py-20 max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Size Nasıl Yardımcı Olabiliriz?</h1>
                <p className="text-xl text-muted-foreground">
                    Sorularınızın cevapları için aşağıdaki kaynakları kullanabilirsiniz.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <div className="rounded-2xl border bg-card p-8 space-y-4 text-center">
                    <h2 className="text-2xl font-bold">Sıkça Sorulan Sorular</h2>
                    <p className="text-muted-foreground">
                        En çok merak edilen konular hakkında hazırladığımız cevaplara göz atın.
                    </p>
                    <Button asChild className="w-full" variant="outline">
                        <Link href="/faq">SSS Sayfasına Git</Link>
                    </Button>
                </div>

                <div className="rounded-2xl border bg-card p-8 space-y-4 text-center">
                    <h2 className="text-2xl font-bold">İletişime Geçin</h2>
                    <p className="text-muted-foreground">
                        Sorunuzun cevabını bulamadınız mı? Destek ekibimize ulaşın.
                    </p>
                    <Button asChild className="w-full">
                        <Link href="/contact">Bize Yazın</Link>
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl bg-primary/5 p-8 text-center space-y-4">
                <h3 className="text-xl font-semibold">Telefonla Destek</h3>
                <p className="text-lg">
                    Hafta içi 09:00 - 18:00 saatleri arasında bize ulaşabilirsiniz.
                </p>
                <a href="tel:+908501234567" className="text-3xl font-bold text-primary block hover:underline">
                    0850 123 45 67
                </a>
            </div>
        </div>
    )
}
