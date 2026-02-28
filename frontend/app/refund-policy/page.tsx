import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "İade ve İptal Politikası | Umrebuldum",
    description:
        "Umrebuldum platformu üzerinden yapılan rezervasyonların iade ve iptal koşulları hakkında bilgi.",
}

export default function RefundPolicyPage() {
    return (
        <div className="container py-12 md:py-16 lg:py-20 max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">İade ve İptal Politikası</h1>
                <p className="text-xl text-muted-foreground">
                    Rezervasyon iptali ve iade süreçleri hakkında bilgilendirme.
                </p>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-sm text-muted-foreground">Son Güncelleme: 28 Şubat 2026</p>

                <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 mb-6">
                    <p className="text-sm">
                        <strong>ℹ️ Önemli Not:</strong> UmreBuldum bir pazaryeri platformudur ve doğrudan tur
                        operatörü değildir. İade ve iptal işlemleri, turunu satın aldığınız acente tarafından
                        yürütülür. Bu sayfa, genel çerçeveyi ve UmreBuldum&apos;un arabuluculuk rolünü açıklamaktadır.
                    </p>
                </div>

                <h2>1. UmreBuldum&apos;un Rolü</h2>
                <p>
                    UmreBuldum, acenteler ile kullanıcılar arasında bir eşleştirme ve iletişim platformu olarak
                    hizmet vermektedir. Bu kapsamda:
                </p>
                <ul>
                    <li>UmreBuldum, tur satış sözleşmesinin tarafı <strong>değildir</strong>.</li>
                    <li>İade ve iptal koşulları, ilgili acentenin politikalarına tabidir.</li>
                    <li>UmreBuldum, uyuşmazlık durumlarında arabuluculuk ve şikâyet değerlendirmesi yapar.</li>
                    <li>Acente değerlendirme sistemi, iade süreçlerindeki performansı da kapsar.</li>
                </ul>

                <h2>2. Genel İptal Koşulları</h2>
                <p>
                    Aşağıdaki iptal koşulları, platformumuzda ilan veren acenteler için önerilen minimum
                    standartlardır. Acente koşulları bu standartlardan farklı olabilir; lütfen rezervasyon
                    öncesinde acentenin kendi iptal politikasını kontrol edin.
                </p>
                <div className="overflow-x-auto">
                    <table>
                        <thead>
                            <tr>
                                <th>İptal Zamanı</th>
                                <th>Önerilen İade Oranı</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Kalkışa 30+ gün kala</td>
                                <td>%100 iade (masraflar hariç)</td>
                            </tr>
                            <tr>
                                <td>Kalkışa 15-30 gün kala</td>
                                <td>%75 iade</td>
                            </tr>
                            <tr>
                                <td>Kalkışa 7-14 gün kala</td>
                                <td>%50 iade</td>
                            </tr>
                            <tr>
                                <td>Kalkışa 0-6 gün kala</td>
                                <td>İade yapılmaz</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2>3. İptal Başvurusu Nasıl Yapılır?</h2>
                <ol>
                    <li>
                        <strong>Acente ile İletişim:</strong> Öncelikle tur satın aldığınız acente ile doğrudan
                        iletişime geçerek iptal talebinizi iletin.
                    </li>
                    <li>
                        <strong>Platform Üzerinden Bildirim:</strong> Dashboard üzerinden ilgili reservasyonunuzu
                        bularak &quot;İptal Talebi&quot; oluşturun.
                    </li>
                    <li>
                        <strong>Belge Hazırlığı:</strong> Ödeme dekontları ve acente ile yapılan yazışmaları
                        saklayın.
                    </li>
                </ol>

                <h2>4. Mücbir Sebepler</h2>
                <p>
                    Aşağıdaki durumlarda, zamanlama fark etmeksizin tam iade uygulanması beklenmektedir:
                </p>
                <ul>
                    <li>Doğal afet veya salgın hastalık nedeniyle seyahat kısıtlaması</li>
                    <li>Suudi Arabistan&apos;ın vize başvurularını askıya alması</li>
                    <li>Savaş, terör veya ciddi güvenlik riski</li>
                    <li>NOTAM (havacılık yasağı) veya uçuş iptali</li>
                    <li>Acentenin lisans/yetki kaybı</li>
                </ul>

                <h2>5. Acente Tarafından İptal</h2>
                <p>Acentenin turu iptal etmesi durumunda:</p>
                <ul>
                    <li>Kullanıcıya <strong>%100 iade</strong> yapılması zorunludur.</li>
                    <li>Alternatif tur teklif edilebilir, ancak kullanıcı kabul etmek zorunda değildir.</li>
                    <li>İptal bildirimi, kalkıştan en az 7 gün önce yapılmalıdır.</li>
                    <li>Bu kurala uymayan acenteler, değerlendirme puanı düşürülmesi ve yaptırımlara tabi tutulur.</li>
                </ul>

                <h2>6. Platform Kredilerinin İadesi</h2>
                <p>
                    UmreBuldum platformunda kullanılan kredilerin iadesi için:
                </p>
                <ul>
                    <li>Kullanılmamış krediler, satın alma tarihinden itibaren 14 gün içinde iade edilebilir.</li>
                    <li>Kullanılmış krediler iade edilemez.</li>
                    <li>Haksız kesinti veya sistem hatası nedeniyle kaybedilen krediler, başvuru üzerine değerlendirilir.</li>
                </ul>

                <h2>7. Şikâyet ve Arabuluculuk</h2>
                <p>
                    İade sürecinde acenteyle anlaşmazlık yaşamanız durumunda UmreBuldum devreye girer:
                </p>
                <ol>
                    <li><strong>Şikâyet Bildirimi:</strong> <Link href="/contact">İletişim sayfamız</Link> üzerinden veya dashboard&apos;dan şikâyet oluşturun.</li>
                    <li><strong>İnceleme:</strong> Ekibimiz her iki tarafın beyanlarını ve belgelerini inceler.</li>
                    <li><strong>Arabuluculuk:</strong> Gerekli görülmesi halinde arabuluculuk süreci başlatılır.</li>
                    <li><strong>Sonuç:</strong> Sonuç ve öneriler taraflara bildirilir. Acente uyumsuzluğu durumunda acente yaptırımlara tabi tutulabilir.</li>
                </ol>
                <p>
                    Arabuluculuk süreci genellikle <strong>5-10 iş günü</strong> sürmektedir.
                </p>

                <h2>8. Tüketici Hakları</h2>
                <p>
                    Bu politika, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve ilgili mevzuat
                    kapsamındaki yasal haklarınızı sınırlamaz. Yasal haklarınız her zaman saklıdır.
                    Tüketici şikâyetlerinizi ayrıca aşağıdaki kanallardan da iletebilirsiniz:
                </p>
                <ul>
                    <li>Tüketici Hakem Heyeti</li>
                    <li>Tüketici Mahkemeleri</li>
                    <li>TÜRSAB Şikâyet Hattı</li>
                    <li>Ticaret Bakanlığı ALO 175 Hattı</li>
                </ul>

                <div className="mt-8 rounded-lg border bg-muted/50 p-6">
                    <h3 className="text-lg font-semibold mb-2">İlgili Belgeler</h3>
                    <ul className="space-y-1 list-none pl-0">
                        <li>
                            <Link href="/terms" className="text-primary hover:underline">→ Kullanım Koşulları</Link>
                        </li>
                        <li>
                            <Link href="/listing-terms" className="text-primary hover:underline">→ İlan Yayınlama Şartları</Link>
                        </li>
                        <li>
                            <Link href="/contact" className="text-primary hover:underline">→ İletişim</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
