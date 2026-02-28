import { Metadata } from "next"
import Link from "next/link"
import { Shield, Eye, Users, HeartHandshake, Award, Globe } from "lucide-react"

export const metadata: Metadata = {
    title: "Hakkımızda | Umrebuldum",
    description:
        "Umrebuldum, hac ve umre yolculuğunuzda size rehberlik eden, güvenilir acenteleri ve en uygun turları bir araya getiren dijital bir platformdur.",
}

const values = [
    {
        icon: Shield,
        title: "Güvenilirlik",
        description: "Sadece kapsamlı doğrulama süreçleri onaylı ve TÜRSAB lisanslı acentelerle çalışıyoruz.",
    },
    {
        icon: Eye,
        title: "Şeffaflık",
        description: "Tüm tur detaylarını, dahil olan hizmetleri ve fiyatları açıkça sunuyoruz.",
    },
    {
        icon: Users,
        title: "Kullanıcı Odaklılık",
        description: "Her kararımızı kullanıcı memnuniyetini ön planda tutarak alıyoruz.",
    },
    {
        icon: HeartHandshake,
        title: "Destek",
        description: "Yolculuğunuzun her aşamasında size destek oluyoruz.",
    },
    {
        icon: Award,
        title: "Kalite",
        description: "Platformumuzdaki her acenteyi titizlikle denetliyor, kalite standardımızı koruyoruz.",
    },
    {
        icon: Globe,
        title: "Erişilebilirlik",
        description: "Türkiye'nin her yerinden, her bütçeye uygun Umre turu seçenekleri sunuyoruz.",
    },
]

const stats = [
    { value: "500+", label: "Listelenen Tur" },
    { value: "50+", label: "Yetkili Acente" },
    { value: "81", label: "İlden Erişim" },
    { value: "7/24", label: "Destek" },
]

export default function AboutPage() {
    return (
        <div className="container py-12 md:py-16 lg:py-20 max-w-5xl mx-auto space-y-16">
            {/* Hero */}
            <div className="text-center space-y-4 max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Hakkımızda</h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                    Kutsal topraklara giden yolda güvenilir dijital rehberiniz.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-2xl border bg-card p-6 text-center space-y-2"
                    >
                        <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                        <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Story */}
            <div className="prose prose-gray dark:prose-invert max-w-none">
                <h2>Hikayemiz</h2>
                <p>
                    UmreBuldum, Umre yolculuğuna çıkmak isteyen binlerce kişinin yaşadığı ortak bir soruna çözüm
                    olarak doğdu: <em>&quot;Hangi acenteye güvenebilirim? Hangi tur bana uygun? Fiyatlar gerçekten
                        adil mi?&quot;</em>
                </p>
                <p>
                    Bu soruları internet üzerinde araştırırken güvenilir bilgiye ulaşmanın ne kadar zor olduğunu
                    bizzat deneyimledik. Onlarca web sitesi, tutarsız fiyatlar, belirsiz hizmet kapsamları...
                    İşte tam da bu noktada, teknolojinin gücüyle şeffaf ve güvenilir bir platform oluşturmaya
                    karar verdik.
                </p>
                <p>
                    Bugün UmreBuldum, Türkiye&apos;nin her yerinden binlerce kullanıcıya kimlik onaylı acentelerin
                    turlarını karşılaştırma, fiyat analizi yapma ve güvenle tur seçme imkanı sunmaktadır.
                </p>

                <h2>Vizyonumuz</h2>
                <p>
                    Teknolojinin gücünü kullanarak manevi yolculukları herkes için daha erişilebilir, şeffaf ve
                    güvenilir hale getirmek. Hac ve Umre organizasyonlarında yaşanan bilgi kirliliğini önleyerek,
                    misafirlerimizin en doğru kararı vermelerine yardımcı olmayı hedefliyoruz.
                </p>

                <h2>Misyonumuz</h2>
                <p>
                    kapsamlı doğrulama süreçleri onaylı yetkili acenteleri tek bir platformda toplayarak,
                    kullanıcılarımıza fiyat, hizmet ve kalite karşılaştırması yapma imkanı sunmak. Her bütçeye
                    ve beklentiye uygun Umre turlarını kolayca bulunabilir kılmak.
                </p>
            </div>

            {/* Values */}
            <div>
                <h2 className="text-3xl font-bold text-center mb-8">Değerlerimiz</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {values.map((value) => (
                        <div
                            key={value.title}
                            className="rounded-2xl border bg-card p-6 space-y-3 hover:shadow-md transition-shadow"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                <value.icon className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">{value.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Team */}
            <div className="prose prose-gray dark:prose-invert max-w-none">
                <h2>Ekibimiz</h2>
                <p>
                    Tecrübeli yazılım mühendisleri, turizm profesyonelleri ve içerik üreticilerinden oluşan
                    ekibimizle, sizlere en iyi kullanıcı deneyimini sunmak için sürekli çalışıyoruz. Ekibimiz,
                    hem dijital dünyayı hem de Hac/Umre sektörünü yakından tanıyan kişilerden oluşur.
                </p>
            </div>

            {/* CTA */}
            <div className="rounded-2xl bg-primary/5 p-8 md:p-12 text-center space-y-4">
                <h3 className="text-2xl font-bold">Sorularınız mı var?</h3>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Platformumuz, hizmetlerimiz veya iş birliği fırsatları hakkında bize her zaman ulaşabilirsiniz.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-lg font-semibold text-primary-foreground hover:bg-primary/90 transition-colors no-underline"
                    >
                        İletişime Geçin
                    </Link>
                    <Link
                        href="/faq"
                        className="inline-flex items-center justify-center rounded-lg border px-8 py-3 text-lg font-semibold hover:bg-accent transition-colors no-underline"
                    >
                        SSS
                    </Link>
                </div>
            </div>
        </div>
    )
}
