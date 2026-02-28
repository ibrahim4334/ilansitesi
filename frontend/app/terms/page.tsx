import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Kullanım Koşulları | Umrebuldum",
    description:
        "Umrebuldum platformunu kullanırken uymanız gereken kurallar, kullanıcı yükümlülükleri ve yasal sorumluluklar.",
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
                <p className="text-sm text-muted-foreground">Son Güncelleme: 28 Şubat 2026</p>

                <h2>1. Taraflar ve Kabul</h2>
                <p>
                    İşbu Kullanım Koşulları (&quot;Sözleşme&quot;), UmreBuldum web sitesini ve mobil uygulamalarını
                    (&quot;Platform&quot;) ziyaret eden, üye olan veya kullanan tüm gerçek ve tüzel kişiler (&quot;Kullanıcı&quot;)
                    ile UmreBuldum (&quot;Şirket&quot;) arasında geçerlidir. Platformu kullanmanız, işbu koşulları
                    okuduğunuz ve kabul ettiğiniz anlamına gelir.
                </p>

                <h2>2. Hizmetin Tanımı ve Kapsamı</h2>
                <p>
                    UmreBuldum, Hac ve Umre turlarını listeleyen, karşılaştırma imkanı sunan bir dijital
                    pazaryeri platformudur. Şirketimiz:
                </p>
                <ul>
                    <li>Doğrudan tur operatörü <strong>değildir</strong>; acenteler ile kullanıcıları bir araya getirir.</li>
                    <li>Turların içeriği, fiyatlandırması ve icrasından acente sorumludur.</li>
                    <li>Kullanıcılar ile acenteler arasında güvenli bir iletişim ve eşleştirme ortamı sağlar.</li>
                    <li>Acente ve rehber doğrulama, puanlama ve değerlendirme sistemleri sunar.</li>
                </ul>

                <h2>3. Üyelik ve Hesap Güvenliği</h2>
                <ul>
                    <li>Üyelik için 18 yaşını doldurmuş olmak gereklidir.</li>
                    <li>Kullanıcı, kayıt sırasında verdiği bilgilerin doğru ve güncel olduğunu taahhüt eder.</li>
                    <li>Hesap bilgileri kişiye özeldir, üçüncü kişilerle paylaşılamaz.</li>
                    <li>Şifre güvenliği kullanıcının sorumluluğundadır; şüpheli bir erişim durumunda derhal şifre değiştirilmelidir.</li>
                    <li>Şirket, güvenlik ihlali şüphesi durumunda hesabı askıya alma hakkını saklı tutar.</li>
                </ul>

                <h2>4. Kullanıcı Yükümlülükleri</h2>
                <p>Kullanıcılar:</p>
                <ul>
                    <li>Platformu hukuka ve ahlaka uygun amaçlarla kullanacağını kabul eder.</li>
                    <li>Yanıltıcı, sahte veya başkasına ait bilgilerle işlem yapmayacağını taahhüt eder.</li>
                    <li>Platform üzerinde spam, zararlı yazılım yayma veya teknik müdahale girişiminde bulunmayacağını kabul eder.</li>
                    <li>Diğer kullanıcıları, acenteleri veya rehberleri rahatsız edici, hakaret içeren veya ayrımcılık barındıran içerikler paylaşmayacağını kabul eder.</li>
                    <li>Platform dışına yönlendirme yaparak güvenlik mekanizmalarını atlatma girişiminde bulunmayacağını taahhüt eder.</li>
                </ul>

                <h2>5. Yasaklı Davranışlar</h2>
                <p>Aşağıdaki eylemler kesinlikle yasaktır ve hesap askıya alma/kapatma ile sonuçlanabilir:</p>
                <ul>
                    <li>Sahte acente veya rehber hesabı oluşturma</li>
                    <li>Sahte değerlendirme veya yorum yazma</li>
                    <li>Otomatik bot veya scraper kullanarak platform verilerini toplama</li>
                    <li>Platformun altyapısına zarar verecek herhangi bir girişimde bulunma</li>
                    <li>Diğer kullanıcıların kişisel verilerini izinsiz toplama veya paylaşma</li>
                    <li>Platform üzerindeki kredi/jeton sistemini manipüle etme girişimi</li>
                </ul>

                <h2>6. Fikri Mülkiyet Hakları</h2>
                <p>
                    Platformda yer alan tüm içerik, tasarım, logo, yazılım, algoritma, veritabanı ve diğer
                    materyaller UmreBuldum&apos;a veya lisans verenlerine aittir. Bu materyaller:
                </p>
                <ul>
                    <li>Önceden yazılı izin alınmadan kopyalanamaz, çoğaltılamaz ve dağıtılamaz.</li>
                    <li>Ticari amaçla kullanılamaz.</li>
                    <li>Tersine mühendislik veya kaynak kodu çıkarma girişiminde bulunulamaz.</li>
                </ul>
                <p>
                    Kullanıcıların platforma yükledikleri içerikler (yorumlar, değerlendirmeler vb.) üzerinde
                    UmreBuldum&apos;a platformda gösterim, düzenleme ve dağıtım için sınırsız, telifsiz lisans
                    verilmiş sayılır.
                </p>

                <h2>7. Sorumluluk Sınırlamaları</h2>
                <ul>
                    <li>UmreBuldum, listelenen turların içeriklerinden, kalitesinden ve acentelerin hizmet kalitesinden <strong>doğrudan sorumlu değildir</strong>.</li>
                    <li>Acenteler ile kullanıcılar arasında akdedilen sözleşmeler tarafları bağlar; UmreBuldum bu sözleşmelerin tarafı değildir.</li>
                    <li>Platform, teknik aksaklıklar, kesintiler veya veri kayıpları nedeniyle doğrudan veya dolaylı zararlardan sorumlu tutulamaz.</li>
                    <li>Ancak UmreBuldum, kullanıcı memnuniyetini sağlamak adına gerekli denetimleri yapmayı ve şikâyetleri değerlendirmeyi taahhüt eder.</li>
                </ul>

                <h2>8. Hesap Askıya Alma ve Kapatma</h2>
                <p>
                    Şirket, aşağıdaki durumlarda kullanıcı hesabını önceden bildirimde bulunmaksızın askıya
                    alabilir veya kalıcı olarak kapatabilir:
                </p>
                <ul>
                    <li>İşbu koşulların ihlali</li>
                    <li>Dolandırıcılık veya güvenlik ihlali şüphesi</li>
                    <li>Yasal makamlardan gelen talepler</li>
                    <li>Uzun süre aktif olmayan hesaplar (12 ay+)</li>
                </ul>

                <h2>9. Değişiklikler</h2>
                <p>
                    Şirket, işbu koşulları dilediği zaman değiştirme hakkını saklı tutar. Güncel koşullar
                    platformda yayınlandığı tarihte yürürlüğe girer. Önemli değişiklikler e-posta ile
                    bildirilir.
                </p>

                <h2>10. Uyuşmazlık Çözümü</h2>
                <p>
                    İşbu koşullardan doğacak uyuşmazlıklarda Türkiye Cumhuriyeti kanunları uygulanır.
                    Uyuşmazlıkların çözümünde İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
                </p>

                <div className="mt-8 rounded-lg border bg-muted/50 p-6">
                    <h3 className="text-lg font-semibold mb-2">İlgili Belgeler</h3>
                    <ul className="space-y-1 list-none pl-0">
                        <li>
                            <Link href="/privacy" className="text-primary hover:underline">→ Gizlilik Politikası</Link>
                        </li>
                        <li>
                            <Link href="/kvkk" className="text-primary hover:underline">→ KVKK Aydınlatma Metni</Link>
                        </li>
                        <li>
                            <Link href="/listing-terms" className="text-primary hover:underline">→ İlan Yayınlama Şartları</Link>
                        </li>
                        <li>
                            <Link href="/refund-policy" className="text-primary hover:underline">→ İade ve İptal Politikası</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
