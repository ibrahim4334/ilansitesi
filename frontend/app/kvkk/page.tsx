import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "KVKK Aydınlatma Metni | Umrebuldum",
    description:
        "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinizin toplanma, işlenme ve aktarılma süreçleri hakkında bilgilendirme.",
}

export default function KVKKPage() {
    return (
        <div className="container py-12 md:py-16 lg:py-20 max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">
                    Kişisel Verilerin Korunması ve İşlenmesi Politikası (KVKK)
                </h1>
                <p className="text-xl text-muted-foreground">
                    6698 sayılı Kanun kapsamında kişisel verileriniz hakkında bilgilendirme.
                </p>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-sm text-muted-foreground">Son Güncelleme: 28 Şubat 2026</p>

                <h2>1. Veri Sorumlusu</h2>
                <p>
                    UmreBuldum (&quot;Platform&quot;, &quot;Şirket&quot;, &quot;Biz&quot;) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu
                    (&quot;KVKK&quot;) kapsamında veri sorumlusu sıfatıyla, kişisel verilerinizi aşağıda açıklanan amaçlar
                    doğrultusunda; hukuka ve dürüstlük kurallarına uygun bir şekilde işlemekte, saklamakta ve aktarmaktayız.
                </p>

                <h2>2. İşlenen Kişisel Veriler</h2>
                <p>Platformumuz aracılığıyla aşağıdaki kişisel verileriniz işlenebilmektedir:</p>
                <div className="overflow-x-auto">
                    <table>
                        <thead>
                            <tr>
                                <th>Veri Kategorisi</th>
                                <th>Örnek Veriler</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Kimlik Bilgileri</strong></td>
                                <td>Ad, soyad</td>
                            </tr>
                            <tr>
                                <td><strong>İletişim Bilgileri</strong></td>
                                <td>E-posta adresi, telefon numarası, şehir</td>
                            </tr>
                            <tr>
                                <td><strong>İşlem Güvenliği</strong></td>
                                <td>IP adresi, şifre (hashlenmiş), giriş-çıkış logları, cihaz bilgileri</td>
                            </tr>
                            <tr>
                                <td><strong>Kullanıcı İşlem Bilgileri</strong></td>
                                <td>Umre talepleri, mesajlaşma içerikleri, arama geçmişi, favori turlar</td>
                            </tr>
                            <tr>
                                <td><strong>Finansal Bilgiler</strong></td>
                                <td>Kredi kullanım geçmişi, satın alma kayıtları (ödeme bilgileri tarafımızca saklanmaz)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2>3. Kişisel Verilerin İşlenme Amaçları</h2>
                <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
                <ul>
                    <li>Üyelik kaydının oluşturulması ve hesap yönetiminin sağlanması</li>
                    <li>Umre turu arama, karşılaştırma ve talep oluşturma hizmetlerinin sunulması</li>
                    <li>Acente ve rehberlerle güvenli iletişim ortamının sağlanması</li>
                    <li>Talep, şikâyet ve önerilerin alınması ve yanıtlanması</li>
                    <li>Platform güvenliğinin sağlanması ve dolandırıcılık faaliyetlerinin önlenmesi</li>
                    <li>Yasal yükümlülüklerin (5651 sayılı Kanun, KVKK vb.) yerine getirilmesi</li>
                    <li>Hizmet kalitesinin artırılması için anonim istatistik ve analiz yapılması</li>
                    <li>Kullanıcı deneyiminin kişiselleştirilmesi</li>
                </ul>

                <h2>4. Kişisel Verilerin Aktarılması</h2>
                <p>
                    Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda ve kanunun
                    öngördüğü sınırlar dahilinde aşağıdaki taraflara aktarılabilir:
                </p>
                <ul>
                    <li><strong>Yetkili kamu kurum ve kuruluşlarına</strong> — yasal yükümlülükler kapsamında</li>
                    <li><strong>İş ortaklarına</strong> — sunucu, e-posta ve analiz hizmet sağlayıcılarına (Vercel, Supabase vb.)</li>
                    <li><strong>Acente ve rehberlere</strong> — açık rızanız doğrultusunda, talep oluşturduğunuz tur/rehberle iletişim amacıyla</li>
                    <li><strong>Hukuki danışmanlara ve denetçilere</strong> — hukuki uyuşmazlıkların çözümü amacıyla</li>
                </ul>
                <p>
                    Verileriniz, yurt dışında bulunan sunucularda (ABD, AB) işlenebilir. Bu durumda KVKK&apos;nın 9. maddesi
                    kapsamındaki güvenlik tedbirleri alınmaktadır.
                </p>

                <h2>5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
                <p>
                    Kişisel verileriniz, platformumuz üzerinden elektronik ortamda (web sitesi formları, API çağrıları)
                    otomatik veya kısmen otomatik yollarla toplanmaktadır.
                </p>
                <p>Verilerinizin işlenmesinin hukuki sebepleri:</p>
                <ul>
                    <li>Açık rızanız (KVKK m. 5/1)</li>
                    <li>Sözleşmenin kurulması veya ifası ile doğrudan ilgili olması (KVKK m. 5/2-c)</li>
                    <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi (KVKK m. 5/2-ç)</li>
                    <li>Meşru menfaatimiz için veri işlenmesinin zorunlu olması (KVKK m. 5/2-f)</li>
                </ul>

                <h2>6. Kişisel Verilerin Saklanma Süresi</h2>
                <p>
                    Kişisel verileriniz, işlenme amaçlarının gerektirdiği süre boyunca ve her halükarda yasal saklama
                    sürelerinin sona ermesine kadar saklanmaktadır. Hesap silme talebiniz üzerine, yasal zorunluluklar
                    hariç olmak üzere verileriniz 30 gün içinde silinir veya anonim hale getirilir.
                </p>

                <h2>7. Veri Güvenliği Tedbirleri</h2>
                <p>Platformumuzda alınan başlıca güvenlik tedbirleri:</p>
                <ul>
                    <li>SSL/TLS şifreleme ile veri iletimi</li>
                    <li>Şifrelerin bcrypt algoritması ile hashlenmiş olarak saklanması</li>
                    <li>Rate limiting ve brute force koruması</li>
                    <li>Düzenli güvenlik denetimleri ve güncellemeler</li>
                    <li>Erişim kontrolü ve yetkilendirme mekanizmaları</li>
                </ul>

                <h2>8. Veri Sahibinin Hakları (KVKK m.11)</h2>
                <p>KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
                <ul>
                    <li>Kişisel veri işlenip işlenmediğini öğrenme</li>
                    <li>Kişisel verileri işlenmişse buna ilişkin bilgi talep etme</li>
                    <li>Kişisel verilerin işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                    <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</li>
                    <li>Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme</li>
                    <li>KVKK m.7 kapsamında kişisel verilerin silinmesini veya yok edilmesini isteme</li>
                    <li>Düzeltme, silme veya yok etme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme</li>
                    <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonuç doğmasına itiraz etme</li>
                    <li>Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
                </ul>

                <h2>9. Başvuru Yöntemi</h2>
                <p>
                    Yukarıda belirtilen haklarınızı kullanmak için aşağıdaki yöntemlerle bize başvurabilirsiniz:
                </p>
                <ul>
                    <li>
                        <strong>E-posta:</strong>{" "}
                        <a href="mailto:kvkk@umrebuldum.com" className="text-primary hover:underline">
                            kvkk@umrebuldum.com
                        </a>
                    </li>
                    <li>
                        <strong>İletişim Formu:</strong>{" "}
                        <Link href="/contact" className="text-primary hover:underline">
                            İletişim sayfamız
                        </Link>{" "}
                        üzerinden
                    </li>
                </ul>
                <p>
                    Başvurularınız, talebin niteliğine göre en kısa sürede ve en geç 30 (otuz) gün içinde
                    ücretsiz olarak sonuçlandırılacaktır.
                </p>

                <div className="mt-8 rounded-lg border bg-muted/50 p-6">
                    <h3 className="text-lg font-semibold mb-2">İlgili Politikalar</h3>
                    <ul className="space-y-1 list-none pl-0">
                        <li>
                            <Link href="/privacy" className="text-primary hover:underline">→ Gizlilik Politikası</Link>
                        </li>
                        <li>
                            <Link href="/cookies" className="text-primary hover:underline">→ Çerez Politikası</Link>
                        </li>
                        <li>
                            <Link href="/consent" className="text-primary hover:underline">→ Açık Rıza Metni</Link>
                        </li>
                        <li>
                            <Link href="/terms" className="text-primary hover:underline">→ Kullanım Koşulları</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
