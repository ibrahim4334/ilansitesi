import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Kullanım Koşulları | Umrebuldum",
    description: "Umrebuldum platformunu kullanırken uymanız gereken kurallar ve yasal sorumluluklar.",
}

export default function TermsPage() {
    return (
        <div className="container py-12 md:py-16 lg:py-20 max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Kullanım Koşulları</h1>
                <p className="text-xl text-muted-foreground">
                    Lütfen platformumuzu kullanmadan önce bu koşulları dikkatlice okuyunuz.
                </p>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-sm text-muted-foreground">Son Güncelleme: 05 Şubat 2026</p>

                <h2>1. Taraflar</h2>
                <p>
                    İşbu Kullanım Koşulları, Umrebuldum web sitesini ziyaret eden veya kullanan herkes ("Kullanıcı") ile Umrebuldum ("Şirket") arasında geçerlidir.
                </p>

                <h2>2. Hizmetin Kapsamı</h2>
                <p>
                    Umrebuldum, Hac ve Umre turlarını listeleyen, karşılaştırma imkanı sunan bir pazaryeri platformudur. Şirketimiz doğrudan tur operatörü değildir; acenteler ile kullanıcıları bir araya getirir.
                </p>

                <h2>3. Kullanıcı Yükümlülükleri</h2>
                <ul>
                    <li>Kullanıcı, siteyi hukuka uygun amaçlarla kullanacağını kabul eder.</li>
                    <li>Kullanıcı, verdiği bilgilerin doğruluğundan sorumludur.</li>
                    <li>Siteye zarar verecek yazılım veya işlemlerden kaçınmalıdır.</li>
                </ul>

                <h2>4. Fikri Mülkiyet</h2>
                <p>
                    Sitede yer alan tüm içerik, tasarım, logo ve yazılımlar Umrebuldum'a veya lisans verenlerine aittir. İzinsiz kopyalanamaz ve kullanılamaz.
                </p>

                <h2>5. Sorumluluk Reddi</h2>
                <p>
                    Umrebuldum, listelenen turların içeriklerinden ve acentelerin hizmet kalitesinden doğrudan sorumlu değildir. Ancak kullanıcı memnuniyeti için gerekli denetimleri yapar.
                </p>

                <h2>6. Değişiklikler</h2>
                <p>
                    Şirket, işbu koşulları dilediği zaman değiştirme hakkını saklı tutar. Güncel koşullar sitede yayınlandığı tarihte yürürlüğe girer.
                </p>

                <h2>7. Uyuşmazlık Çözümü</h2>
                <p>
                    İşbu koşullardan doğacak uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
                </p>
            </div>
        </div>
    )
}
