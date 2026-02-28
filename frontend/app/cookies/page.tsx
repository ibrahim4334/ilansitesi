import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Çerez Politikası | Umrebuldum",
    description:
        "Umrebuldum web sitesinde kullanılan çerez türleri, amaçları ve yönetimi hakkında bilgi.",
}

export default function CookiesPage() {
    return (
        <div className="container py-12 md:py-16 lg:py-20 max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Çerez Politikası</h1>
                <p className="text-xl text-muted-foreground">
                    Web sitemizde çerezlerin nasıl kullanıldığını öğrenin.
                </p>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-sm text-muted-foreground">Son Güncelleme: 28 Şubat 2026</p>

                <h2>1. Çerez Nedir?</h2>
                <p>
                    Çerezler (cookies), web sitelerinin tarayıcınıza yerleştirdiği küçük metin dosyalarıdır.
                    Bu dosyalar, web sitesinin sizi tanımasına, tercihlerinizi hatırlamasına ve size daha iyi
                    bir kullanım deneyimi sunmasına yardımcı olur.
                </p>

                <h2>2. Kullandığımız Çerez Türleri</h2>

                <h3>2.1. Zorunlu Çerezler</h3>
                <p>
                    Bu çerezler, web sitesinin temel işlevlerinin çalışması için gereklidir ve devre dışı
                    bırakılamazlar.
                </p>
                <div className="overflow-x-auto">
                    <table>
                        <thead>
                            <tr>
                                <th>Çerez Adı</th>
                                <th>Amaç</th>
                                <th>Süre</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>session-token</code></td>
                                <td>Oturum yönetimi ve kimlik doğrulama</td>
                                <td>Oturum süresi / 30 gün</td>
                            </tr>
                            <tr>
                                <td><code>csrf-token</code></td>
                                <td>Güvenlik — CSRF saldırılarını önleme</td>
                                <td>Oturum süresi</td>
                            </tr>
                            <tr>
                                <td><code>cookie-consent</code></td>
                                <td>Çerez tercihlerinizi saklama</td>
                                <td>1 yıl</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3>2.2. İşlevsel Çerezler</h3>
                <p>
                    Bu çerezler, dil tercihi ve tema gibi kişisel ayarlarınızın hatırlanmasını sağlar.
                </p>
                <div className="overflow-x-auto">
                    <table>
                        <thead>
                            <tr>
                                <th>Çerez Adı</th>
                                <th>Amaç</th>
                                <th>Süre</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>theme</code></td>
                                <td>Açık/koyu tema tercihi</td>
                                <td>1 yıl</td>
                            </tr>
                            <tr>
                                <td><code>locale</code></td>
                                <td>Dil tercihi</td>
                                <td>1 yıl</td>
                            </tr>
                            <tr>
                                <td><code>recent-searches</code></td>
                                <td>Son arama geçmişi</td>
                                <td>30 gün</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3>2.3. Analitik Çerezler</h3>
                <p>
                    Web sitemizin performansını ölçmek ve kullanıcı deneyimini iyileştirmek için kullanılır.
                    Bu çerezler anonim veriler toplar.
                </p>
                <div className="overflow-x-auto">
                    <table>
                        <thead>
                            <tr>
                                <th>Çerez Adı</th>
                                <th>Sağlayıcı</th>
                                <th>Amaç</th>
                                <th>Süre</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>_va</code></td>
                                <td>Vercel Analytics</td>
                                <td>Sayfa görüntüleme ve performans metrikleri</td>
                                <td>Oturum süresi</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3>2.4. Üçüncü Taraf Çerezleri</h3>
                <p>
                    Bazı üçüncü taraf hizmet sağlayıcılar da web sitemizde çerez yerleştirebilir:
                </p>
                <ul>
                    <li><strong>Supabase:</strong> Kimlik doğrulama ve oturum yönetimi</li>
                    <li><strong>Vercel:</strong> Performans izleme ve hata takibi</li>
                </ul>

                <h2>3. Çerezleri Yönetme</h2>
                <p>
                    Çerezleri tarayıcı ayarlarınızdan kontrol edebilirsiniz. Aşağıda popüler tarayıcılar
                    için çerez yönetimi bağlantıları bulunmaktadır:
                </p>
                <ul>
                    <li>
                        <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
                            Google Chrome
                        </a>
                    </li>
                    <li>
                        <a href="https://support.mozilla.org/tr/kb/cerezleri-silme-web-sitelerinin-bilgilerini-kaldirma" target="_blank" rel="noopener noreferrer">
                            Mozilla Firefox
                        </a>
                    </li>
                    <li>
                        <a href="https://support.apple.com/tr-tr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
                            Safari
                        </a>
                    </li>
                    <li>
                        <a href="https://support.microsoft.com/tr-tr/microsoft-edge/microsoft-edge-de-%C3%A7erezleri-silin" target="_blank" rel="noopener noreferrer">
                            Microsoft Edge
                        </a>
                    </li>
                </ul>

                <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4">
                    <p className="text-sm">
                        <strong>⚠️ Uyarı:</strong> Zorunlu çerezleri devre dışı bırakmanız halinde web sitemizin
                        bazı temel işlevleri (oturum açma, güvenlik kontrolleri vb.) düzgün çalışmayabilir.
                    </p>
                </div>

                <h2>4. &quot;Do Not Track&quot; Sinyalleri</h2>
                <p>
                    Tarayıcınızdan gönderilen &quot;Do Not Track&quot; (DNT) sinyallerine saygı duyuyoruz. DNT etkin
                    olduğunda, analitik çerezleri devre dışı bırakılır.
                </p>

                <h2>5. Politika Güncellemeleri</h2>
                <p>
                    Bu Çerez Politikası&apos;nı gerektiğinde güncelleyebiliriz. Değişiklikler bu sayfada
                    yayınlanır ve önemli değişiklikler için bildirim yapılır.
                </p>

                <h2>6. İletişim</h2>
                <p>
                    Çerez politikamızla ilgili sorularınız için{" "}
                    <a href="mailto:info@umrebuldum.com" className="text-primary hover:underline">info@umrebuldum.com</a>{" "}
                    adresinden veya{" "}
                    <Link href="/contact" className="text-primary hover:underline">İletişim sayfamızdan</Link>{" "}
                    bize ulaşabilirsiniz.
                </p>

                <div className="mt-8 rounded-lg border bg-muted/50 p-6">
                    <h3 className="text-lg font-semibold mb-2">İlgili Politikalar</h3>
                    <ul className="space-y-1 list-none pl-0">
                        <li>
                            <Link href="/privacy" className="text-primary hover:underline">→ Gizlilik Politikası</Link>
                        </li>
                        <li>
                            <Link href="/kvkk" className="text-primary hover:underline">→ KVKK Aydınlatma Metni</Link>
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
