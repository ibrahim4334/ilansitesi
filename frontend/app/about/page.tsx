import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Hakkımızda | Umrebuldum",
    description: "Umrebuldum, hac ve umre yolculuğunuzda size rehberlik eden, güvenilir acenteleri ve en uygun turları bir araya getiren dijital bir platformdur.",
}

export default function AboutPage() {
    return (
        <div className="container py-12 md:py-16 lg:py-20 max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Hakkımızda</h1>
                <p className="text-xl text-muted-foreground">
                    Kutsal topraklara giden yolda güvenilir rehberiniz.
                </p>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
                <h2>Vizyonumuz</h2>
                <p>
                    Umrebuldum olarak vizyonumuz, teknolojinin gücünü kullanarak manevi yolculukları herkes için daha erişilebilir, şeffaf ve güvenilir hale getirmektir. Hac ve Umre organizasyonlarında yaşanan bilgi kirliliğini önleyerek, misafirlerimizin en doğru kararı vermelerine yardımcı olmayı hedefliyoruz.
                </p>

                <h2>Misyonumuz</h2>
                <p>
                    Misyonumuz, Diyanet İşleri Başkanlığı onaylı yetkili acenteleri tek bir platformda toplayarak, kullanıcılarımıza fiyat, hizmet ve kalite karşılaştırması yapma imkanı sunmaktır. Amacımız, her bütçeye ve beklentiy uygun Umre turlarını kolayca bulunabilir kılmaktır.
                </p>

                <h2>Neden Umrebuldum?</h2>
                <ul>
                    <li><strong>Güvenilirlik:</strong> Sadece lisanslı ve yetkili acentelerle çalışıyoruz.</li>
                    <li><strong>Şeffaflık:</strong> Tüm tur detaylarını ve fiyatları açıkça sunuyoruz.</li>
                    <li><strong>Kolaylık:</strong> Gelişmiş filtreleme seçenekleri ile aradığınız turu saniyeler içinde bulabilirsiniz.</li>
                    <li><strong>Destek:</strong> Yolculuğunuzun her aşamasında size destek oluyoruz.</li>
                </ul>

                <h2>Ekibimiz</h2>
                <p>
                    Tecrübeli yazılım mühendisleri, turizm profesyonelleri ve içerik üreticilerinden oluşan ekibimizle, sizlere en iyi kullanıcı deneyimini sunmak için sürekli çalışıyoruz.
                </p>
            </div>
        </div>
    )
}
