import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Aydınlatma ve Açık Rıza Metni | Umrebuldum",
    description:
        "KVKK kapsamında kişisel verilerinizin işlenmesine ilişkin aydınlatma ve açık rıza metni.",
}

export default function ConsentPage() {
    return (
        <div className="container py-12 md:py-16 lg:py-20 max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Aydınlatma ve Açık Rıza Metni</h1>
                <p className="text-xl text-muted-foreground">
                    KVKK kapsamında kişisel verilerinizin işlenmesine ilişkin bilgilendirme ve rıza metni.
                </p>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-sm text-muted-foreground">Son Güncelleme: 28 Şubat 2026</p>

                <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 mb-6">
                    <p className="text-sm">
                        <strong>ℹ️ Bu metin nedir?</strong> 6698 sayılı KVKK&apos;nın 10. maddesi uyarınca,
                        kişisel verilerinizin işlenmesi öncesinde tarafınıza yapılan bilgilendirme
                        (aydınlatma) ve gerekli hallerde alınan açık rıza metnidir.
                    </p>
                </div>

                {/* Part 1: Aydınlatma Metni */}
                <h2>Bölüm 1: Aydınlatma Metni</h2>

                <h3>1.1. Veri Sorumlusu</h3>
                <p>
                    UmreBuldum (&quot;Şirket&quot;) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu
                    kapsamında veri sorumlusu sıfatıyla hareket etmekteyiz.
                </p>

                <h3>1.2. İşlenen Kişisel Veriler ve Amaçları</h3>
                <p>
                    Platformumuza kayıt olmanız ve hizmetlerimizi kullanmanız sırasında aşağıdaki kişisel
                    verileriniz belirtilen amaçlarla işlenmektedir:
                </p>
                <div className="overflow-x-auto">
                    <table>
                        <thead>
                            <tr>
                                <th>Veri Kategorisi</th>
                                <th>İşlenme Amacı</th>
                                <th>Hukuki Sebep</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Ad, Soyad</td>
                                <td>Üyelik oluşturma, sözleşme ifası</td>
                                <td>Sözleşme (m.5/2-c)</td>
                            </tr>
                            <tr>
                                <td>E-posta</td>
                                <td>Hesap doğrulama, bildirimler</td>
                                <td>Sözleşme (m.5/2-c)</td>
                            </tr>
                            <tr>
                                <td>Telefon</td>
                                <td>Acente ile iletişim, SMS doğrulama</td>
                                <td>Açık Rıza (m.5/1)</td>
                            </tr>
                            <tr>
                                <td>Şehir</td>
                                <td>Kalkış noktasına göre tur önerisi</td>
                                <td>Meşru Menfaat (m.5/2-f)</td>
                            </tr>
                            <tr>
                                <td>IP Adresi</td>
                                <td>Güvenlik, yasal yükümlülük</td>
                                <td>Hukuki Yükümlülük (m.5/2-ç)</td>
                            </tr>
                            <tr>
                                <td>Arama Geçmişi</td>
                                <td>Kişiselleştirilmiş öneriler</td>
                                <td>Açık Rıza (m.5/1)</td>
                            </tr>
                            <tr>
                                <td>Mesajlaşma İçerikleri</td>
                                <td>İletişim kolaylığı, şikâyet çözümü</td>
                                <td>Sözleşme (m.5/2-c)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3>1.3. Verilerin Aktarılma Amacı ve Taraflar</h3>
                <ul>
                    <li><strong>Acenteler/Rehberler:</strong> Talep oluşturmanız halinde, iletişim bilgileriniz ilgili acente/rehberle paylaşılır.</li>
                    <li><strong>Altyapı Sağlayıcıları:</strong> Supabase (veritabanı), Vercel (barındırma) gibi teknik hizmet sağlayıcılarla.</li>
                    <li><strong>Resmi Kurumlar:</strong> Yasal zorunluluk halinde yetkili kurum ve kuruluşlarla.</li>
                </ul>

                <h3>1.4. Haklar</h3>
                <p>
                    KVKK&apos;nın 11. maddesi kapsamındaki tüm haklarınız saklıdır (öğrenme, düzeltme, silme,
                    itiraz vb.). Detaylı bilgi için{" "}
                    <Link href="/kvkk" className="text-primary hover:underline">KVKK Aydınlatma Metni</Link>{" "}
                    sayfamızı inceleyebilirsiniz.
                </p>

                {/* Part 2: Açık Rıza Metni */}
                <h2>Bölüm 2: Açık Rıza Metni</h2>

                <p>
                    Aşağıdaki hususlar için açık rızanız gerekmektedir. Bu rızalar birbirinden bağımsızdır;
                    herhangi birine onay vermemeniz diğerlerini etkilemez.
                </p>

                <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                        <h3 className="text-base font-semibold mb-2">✅ Rıza 1: İletişim Bilgilerinin Acente ile Paylaşılması</h3>
                        <p className="text-sm text-muted-foreground">
                            Umre turu talebi oluşturduğumda, ad-soyad, e-posta ve telefon bilgilerimin ilgili
                            acente/rehber ile paylaşılmasına açık rıza gösteriyorum. Bu paylaşım, yalnızca talep
                            ettiğim tur kapsamında ve iletişim amacıyla yapılacaktır.
                        </p>
                    </div>

                    <div className="rounded-lg border p-4">
                        <h3 className="text-base font-semibold mb-2">✅ Rıza 2: Kişiselleştirilmiş Öneriler</h3>
                        <p className="text-sm text-muted-foreground">
                            Arama geçmişim ve tercihlerimin analiz edilerek bana özel tur önerilerinde
                            bulunulmasına açık rıza gösteriyorum. Bu veriler anonim hale getirilerek
                            genel istatistiklerde de kullanılabilir.
                        </p>
                    </div>

                    <div className="rounded-lg border p-4">
                        <h3 className="text-base font-semibold mb-2">✅ Rıza 3: Pazarlama İletişimi</h3>
                        <p className="text-sm text-muted-foreground">
                            E-posta ve/veya SMS yoluyla kampanya, indirim ve yeni turlar hakkında bilgilendirme
                            mesajları almayı kabul ediyorum. Bu onayımı istediğim zaman geri çekebileceğimi
                            biliyorum.
                        </p>
                    </div>

                    <div className="rounded-lg border p-4">
                        <h3 className="text-base font-semibold mb-2">✅ Rıza 4: Yurt Dışına Veri Aktarımı</h3>
                        <p className="text-sm text-muted-foreground">
                            Kişisel verilerimin, hizmet sürdürülebilirliği amacıyla yurt dışında bulunan
                            sunucularda (AB, ABD) işlenmesine ve saklanmasına açık rıza gösteriyorum.
                        </p>
                    </div>
                </div>

                <h3>Rıza Geri Çekme</h3>
                <p>
                    Vermiş olduğunuz açık rızaları istediğiniz zaman, herhangi bir gerekçe göstermeksizin
                    geri çekebilirsiniz. Rıza geri çekme işlemi için:
                </p>
                <ul>
                    <li>Dashboard &gt; Hesap Ayarları &gt; Gizlilik bölümünden</li>
                    <li><a href="mailto:kvkk@umrebuldum.com" className="text-primary hover:underline">kvkk@umrebuldum.com</a> adresine e-posta göndererek</li>
                    <li><Link href="/contact" className="text-primary hover:underline">İletişim formu</Link> üzerinden</li>
                </ul>
                <p>
                    Rıza geri çekme, geri çekmeden önce yapılan işlemlerin hukuka uygunluğunu etkilemez.
                    Ancak bazı hizmetlerin sunulabilmesi için belirli rızaların gerekli olabileceğini
                    hatırlatmak isteriz.
                </p>

                <h2>İletişim</h2>
                <p>
                    Aydınlatma ve açık rıza metni hakkında sorularınız için:
                </p>
                <ul>
                    <li>
                        <strong>E-posta:</strong>{" "}
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
                            <Link href="/privacy" className="text-primary hover:underline">→ Gizlilik Politikası</Link>
                        </li>
                        <li>
                            <Link href="/cookies" className="text-primary hover:underline">→ Çerez Politikası</Link>
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
