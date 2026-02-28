import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Gizlilik Politikası | Umrebuldum",
    description:
        "Kişisel verilerinizin nasıl toplandığı, kullanıldığı, korunduğu ve üçüncü taraflarla paylaşıldığı hakkında detaylı bilgi.",
}

export default function PrivacyPage() {
    return (
        <div className="container py-12 md:py-16 lg:py-20 max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Gizlilik Politikası</h1>
                <p className="text-xl text-muted-foreground">
                    Verilerinizin güvenliği bizim için önceliktir.
                </p>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-sm text-muted-foreground">Son Güncelleme: 28 Şubat 2026</p>

                <h2>1. Giriş</h2>
                <p>
                    UmreBuldum (&quot;Biz&quot;, &quot;Şirket&quot;, &quot;Platform&quot;) olarak, ziyaretçilerimizin ve kullanıcılarımızın
                    gizliliğine büyük önem veriyoruz. Bu Gizlilik Politikası, web sitemizi ve hizmetlerimizi
                    kullandığınızda kişisel verilerinizin nasıl toplandığını, işlendiğini, saklandığını ve
                    korunduğunu açıklamaktadır.
                </p>
                <p>
                    Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK), 5809 sayılı Elektronik
                    Haberleşme Kanunu ve ilgili mevzuat hükümlerine uygun olarak hazırlanmıştır.
                </p>

                <h2>2. Toplanan Veriler</h2>
                <h3>2.1. Doğrudan Sağladığınız Veriler</h3>
                <ul>
                    <li><strong>Kimlik Bilgileri:</strong> Ad, soyad</li>
                    <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası, şehir</li>
                    <li><strong>Hesap Bilgileri:</strong> Kullanıcı adı, şifre (hashlenmiş), profil fotoğrafı</li>
                    <li><strong>İçerik:</strong> Yorumlar, değerlendirmeler, mesajlar, umre talep detayları</li>
                </ul>

                <h3>2.2. Otomatik Olarak Toplanan Veriler</h3>
                <ul>
                    <li><strong>Teknik Bilgiler:</strong> IP adresi, tarayıcı türü ve sürümü, işletim sistemi, cihaz bilgileri</li>
                    <li><strong>Kullanım Bilgileri:</strong> Sayfa görüntüleme, tıklama verileri, arama sorguları, oturum süresi</li>
                    <li><strong>Çerez Verileri:</strong> Oturum çerezleri, tercih çerezleri, analitik çerezleri (<Link href="/cookies">detaylar için Çerez Politikası</Link>)</li>
                    <li><strong>Log Kayıtları:</strong> Giriş/çıkış zamanları, hata logları, API erişim kayıtları</li>
                </ul>

                <h2>3. Verilerin Kullanım Amaçları</h2>
                <p>Topladığımız verileri şu amaçlarla kullanıyoruz:</p>
                <ul>
                    <li><strong>Hizmet Sunumu:</strong> Umre turu arama, listeleme, karşılaştırma ve talep oluşturma hizmetlerinin sağlanması</li>
                    <li><strong>Hesap Yönetimi:</strong> Kayıt, giriş, profil yönetimi ve kimlik doğrulama işlemleri</li>
                    <li><strong>İletişim:</strong> Bildirimler, hizmet güncellemeleri ve destek talepleri</li>
                    <li><strong>Güvenlik:</strong> Dolandırıcılık önleme, hesap güvenliği ve platform bütünlüğünün korunması</li>
                    <li><strong>Analiz:</strong> Hizmet kalitesinin artırılması, kullanıcı deneyiminin iyileştirilmesi</li>
                    <li><strong>Yasal Uyum:</strong> 5651 sayılı Kanun kapsamında log saklama ve yasal yükümlülüklerin yerine getirilmesi</li>
                </ul>

                <h2>4. Verilerin Paylaşımı</h2>
                <p>Kişisel verileriniz aşağıdaki durumlarda üçüncü taraflarla paylaşılabilir:</p>

                <h3>4.1. Hizmet Sağlayıcılar</h3>
                <div className="overflow-x-auto">
                    <table>
                        <thead>
                            <tr>
                                <th>Hizmet Sağlayıcı</th>
                                <th>Amaç</th>
                                <th>Konum</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Vercel</td>
                                <td>Web barındırma ve CDN</td>
                                <td>ABD / Global</td>
                            </tr>
                            <tr>
                                <td>Supabase</td>
                                <td>Veritabanı ve kimlik doğrulama</td>
                                <td>AB / ABD</td>
                            </tr>
                            <tr>
                                <td>Analitik araçları</td>
                                <td>Kullanım analitiği</td>
                                <td>ABD</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3>4.2. Diğer Paylaşımlar</h3>
                <ul>
                    <li><strong>Acenteler ve Rehberler:</strong> Talep oluşturduğunuzda, açık rızanız ile iletişim bilgileriniz ilgili acente/rehberle paylaşılır.</li>
                    <li><strong>Yasal Makamlar:</strong> Mahkeme kararı veya yetkili makam talebi üzerine yasal zorunluluk kapsamında.</li>
                    <li><strong>Hukuki Danışmanlar:</strong> Hukuki uyuşmazlıkların çözümü amacıyla.</li>
                </ul>

                <h2>5. Çerezler (Cookies)</h2>
                <p>
                    Web sitemizde kullanıcı deneyimini geliştirmek ve hizmetlerimizi kişiselleştirmek için
                    çerezler kullanmaktayız. Çerez türleri, amaçları ve yönetimi hakkında detaylı bilgi
                    için <Link href="/cookies">Çerez Politikası</Link> sayfamızı inceleyebilirsiniz.
                </p>

                <h2>6. Veri Saklama Süreleri</h2>
                <div className="overflow-x-auto">
                    <table>
                        <thead>
                            <tr>
                                <th>Veri Türü</th>
                                <th>Saklama Süresi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Hesap bilgileri</td>
                                <td>Hesap aktif olduğu sürece + hesap silme sonrası 30 gün</td>
                            </tr>
                            <tr>
                                <td>İşlem kayıtları</td>
                                <td>10 yıl (vergi mevzuatı)</td>
                            </tr>
                            <tr>
                                <td>Log kayıtları</td>
                                <td>2 yıl (5651 s. Kanun)</td>
                            </tr>
                            <tr>
                                <td>Çerez verileri</td>
                                <td>Çerez türüne göre değişir (bkz. Çerez Politikası)</td>
                            </tr>
                            <tr>
                                <td>Mesajlaşma geçmişi</td>
                                <td>Hesap aktif olduğu sürece</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2>7. Veri Güvenliği</h2>
                <p>
                    Kişisel verilerinizi korumak için aşağıdaki güvenlik önlemlerini uyguluyoruz:
                </p>
                <ul>
                    <li>256-bit SSL/TLS şifreleme ile tüm veri iletimi</li>
                    <li>Şifrelerin endüstri standardı bcrypt hash algoritması ile saklanması</li>
                    <li>Düzenli güvenlik denetimleri ve penetrasyon testleri</li>
                    <li>Çok faktörlü kimlik doğrulama desteği</li>
                    <li>Rol tabanlı erişim kontrolü (RBAC)</li>
                    <li>Rate limiting ve DDoS koruması</li>
                    <li>Düzenli yedekleme ve felaket kurtarma planı</li>
                </ul>

                <h2>8. Uluslararası Veri Transferi</h2>
                <p>
                    Hizmet sağlayıcılarımızın bir kısmı yurt dışında (ABD, AB) bulunduğundan, kişisel
                    verileriniz bu ülkelere transfer edilebilir. Bu transferler:
                </p>
                <ul>
                    <li>KVKK&apos;nın 9. maddesi kapsamındaki güvenlik gereksinimlerine uygun olarak gerçekleştirilir.</li>
                    <li>İlgili hizmet sağlayıcılarla veri işleme sözleşmeleri (DPA) imzalanmıştır.</li>
                    <li>Yeterli koruma düzeyi sağlayan ülkelere veya taahhütname kapsamında transferler yapılır.</li>
                </ul>

                <h2>9. Haklarınız</h2>
                <p>
                    KVKK kapsamında aşağıdaki haklara sahipsiniz:
                </p>
                <ul>
                    <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                    <li>İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                    <li>Verilerin aktarıldığı üçüncü kişileri bilme</li>
                    <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
                    <li>Verilerin silinmesini veya yok edilmesini isteme</li>
                    <li>Otomatik sistemler vasıtasıyla aleyhinize bir sonuç doğmasına itiraz etme</li>
                    <li>Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme</li>
                </ul>
                <p>
                    Haklarınızı kullanmak için <Link href="/contact">İletişim</Link> sayfamızı veya{" "}
                    <a href="mailto:kvkk@umrebuldum.com" className="text-primary hover:underline">kvkk@umrebuldum.com</a>{" "}
                    adresini kullanabilirsiniz.
                </p>

                <h2>10. Çocukların Gizliliği</h2>
                <p>
                    Platformumuz 18 yaşından küçük bireylere yönelik değildir. Bilinçli olarak 18 yaşından
                    küçüklerin kişisel verilerini toplamıyoruz. Bu tür verilerin toplandığını fark etmemiz
                    halinde derhal sileriz.
                </p>

                <h2>11. Politika Değişiklikleri</h2>
                <p>
                    Bu Gizlilik Politikası&apos;nı gerekli gördüğümüzde güncelleyebiliriz. Önemli değişiklikler
                    yapıldığında, sizi e-posta veya platform bildirimi ile bilgilendiririz. Güncel sürüm
                    her zaman bu sayfada yayınlanır.
                </p>

                <h2>12. İletişim</h2>
                <p>
                    Gizlilik politikamızla ilgili soru, talep ve şikâyetleriniz için:
                </p>
                <ul>
                    <li>
                        <strong>E-posta:</strong>{" "}
                        <a href="mailto:info@umrebuldum.com" className="text-primary hover:underline">info@umrebuldum.com</a>
                    </li>
                    <li>
                        <strong>KVKK Talepleri:</strong>{" "}
                        <a href="mailto:kvkk@umrebuldum.com" className="text-primary hover:underline">kvkk@umrebuldum.com</a>
                    </li>
                    <li>
                        <strong>İletişim Formu:</strong>{" "}
                        <Link href="/contact" className="text-primary hover:underline">İletişim Sayfası</Link>
                    </li>
                </ul>

                <div className="mt-8 rounded-lg border bg-muted/50 p-6">
                    <h3 className="text-lg font-semibold mb-2">İlgili Politikalar</h3>
                    <ul className="space-y-1 list-none pl-0">
                        <li>
                            <Link href="/kvkk" className="text-primary hover:underline">→ KVKK Aydınlatma Metni</Link>
                        </li>
                        <li>
                            <Link href="/cookies" className="text-primary hover:underline">→ Çerez Politikası</Link>
                        </li>
                        <li>
                            <Link href="/terms" className="text-primary hover:underline">→ Kullanım Koşulları</Link>
                        </li>
                        <li>
                            <Link href="/consent" className="text-primary hover:underline">→ Açık Rıza Metni</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
