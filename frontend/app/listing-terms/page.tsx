import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "İlan Yayınlama Şartları | Umrebuldum",
    description:
        "Umrebuldum platformunda ilan yayınlamak için uyulması gereken kurallar, içerik politikaları ve onay süreci.",
}

export default function ListingTermsPage() {
    return (
        <div className="container py-12 md:py-16 lg:py-20 max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">İlan Yayınlama Şartları</h1>
                <p className="text-xl text-muted-foreground">
                    Platformumuzda ilan yayınlamak için uymanız gereken kurallar ve politikalar.
                </p>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-sm text-muted-foreground">Son Güncelleme: 28 Şubat 2026</p>

                <h2>1. Genel İlkeler</h2>
                <p>
                    UmreBuldum platformunda ilan yayınlamak, belirli şartlar ve standartlara uyumu gerektirir.
                    Bu şartlar, platformumuzun güvenilirliğini korumak, kullanıcılarımıza kaliteli hizmet
                    sunulmasını sağlamak ve yasal yükümlülükleri yerine getirmek amacıyla belirlenmiştir.
                </p>

                <h2>2. İlan Yayınlama Yetkililiği</h2>
                <p>Platformumuzda ilan yayınlayabilmek için aşağıdaki şartların karşılanması gerekir:</p>

                <h3>2.1. Acenteler İçin</h3>
                <ul>
                    <li><strong>TÜRSAB Belgesi:</strong> Geçerli bir TÜRSAB (A Grubu) seyahat acentası belgesine sahip olunmalıdır.</li>
                    <li><strong>Kimlik Onayı:</strong> kapsamlı doğrulama süreçleri&apos;ndan Umre organizasyonu düzenleme yetkisi alınmış olmalıdır.</li>
                    <li><strong>Vergi Kaydı:</strong> Geçerli vergi levhası ve ticaret sicil kaydı bulunmalıdır.</li>
                    <li><strong>Platform Doğulaması:</strong> UmreBuldum&apos;un kimlik ve belge doğrulama sürecinden geçilmiş olmalıdır.</li>
                </ul>

                <h3>2.2. Rehberler İçin</h3>
                <ul>
                    <li><strong>Rehber Belgesi:</strong> Kültür ve Turizm Bakanlığı onaylı profesyonel turist rehberi belgesi.</li>
                    <li><strong>Kimlik Rozeti (İsteğe Bağlı):</strong> kapsamlı doğrulama süreçleri onaylı rehber rozeti (daha yüksek güvenilirlik puanı).</li>
                    <li><strong>Kimlik Doğrulama:</strong> TC kimlik numarası ve kimlik belgesi ile doğrulama.</li>
                </ul>

                <h2>3. İlan İçerik Politikası</h2>
                <p>İlanlar aşağıdaki standartlara uygun hazırlanmalıdır:</p>

                <h3>3.1. Zorunlu Bilgiler</h3>
                <p>Her ilan aşağıdaki bilgileri içermelidir:</p>
                <ul>
                    <li>Turun başlangıç ve bitiş tarihleri</li>
                    <li>Kalkış noktası (şehir)</li>
                    <li>Konaklama detayları (otel adı, yıldız sayısı, Harem-i Şerif&apos;e mesafe)</li>
                    <li>Tura dahil olan hizmetler (uçak bileti, vize, transfer, rehberlik vb.)</li>
                    <li>Tura dahil olmayan hizmetler</li>
                    <li><strong>Fiyat bilgisi (SAR — Suudi Arabistan Riyali cinsinden)</strong></li>
                    <li>Kontenjan bilgisi</li>
                    <li>İptal ve iade koşulları</li>
                </ul>

                <h3>3.2. Fiyatlandırma Kuralları</h3>
                <ul>
                    <li>Fiyatlar <strong>SAR (Suudi Arabistan Riyali)</strong> cinsinden belirtilmelidir.</li>
                    <li>Fiyatlar, tüm vergiler ve zorunlu ücretler dahil olarak gösterilmelidir.</li>
                    <li>Gizli ücret veya ek masraf olmamalıdır.</li>
                    <li>Kişi başı fiyat açıkça belirtilmelidir.</li>
                    <li>İndirimli fiyatlar, gerçek bir indirim yansıtmalıdır; yanıltıcı indirim uygulaması yasaktır.</li>
                </ul>

                <h3>3.3. Görsel ve Medya Kuralları</h3>
                <ul>
                    <li>İlan görselleri gerçek ve güncel olmalıdır.</li>
                    <li>Stok fotoğraf kullanılmaması önerilir; kullanılacaksa belirtilmelidir.</li>
                    <li>Yanıltıcı veya aşırı düzenlenmiş görseller kullanılamaz.</li>
                    <li>Görsellerin çözünürlüğü en az 800x600 piksel olmalıdır.</li>
                    <li>Telif hakkı ihlali oluşturacak görseller kullanılamaz.</li>
                </ul>

                <h2>4. Yasaklı İçerikler</h2>
                <p>Aşağıdaki içerikler kesinlikle yasaktır:</p>
                <ul>
                    <li>Yanıltıcı veya gerçeğe aykırı bilgiler</li>
                    <li>Sahte indirim veya kampanya bilgileri</li>
                    <li>Rakip acenteleri kötüleyen ifadeler</li>
                    <li>Siyasi içerik veya propaganda</li>
                    <li>Dini hassasiyetleri zedeleyecek içerikler</li>
                    <li>Yasal olmayan hizmet teklifleri</li>
                    <li>Kişisel iletişim bilgileri ile platform dışına yönlendirme</li>
                    <li>Spam veya tekrarlayan ilan paylaşımı</li>
                </ul>

                <h2>5. İlan Onay Süreci</h2>
                <p>İlanlar yayınlanmadan önce aşağıdaki süreçten geçer:</p>
                <ol>
                    <li><strong>İlan Oluşturma:</strong> Acente/rehber gerekli bilgileri doldurur ve ilanı gönderir.</li>
                    <li><strong>Otomatik Kontrol:</strong> Sistem, zorunlu alanları ve format uyumluluğunu kontrol eder.</li>
                    <li><strong>Manuel İnceleme:</strong> Ekibimiz içerik politikasına uygunluğu değerlendirir.</li>
                    <li><strong>Onay/Red:</strong> İlan onaylanarak yayınlanır veya düzeltme talepleri ile birlikte reddedilir.</li>
                </ol>
                <p>
                    Onay süreci genellikle <strong>24 saat</strong> içinde tamamlanır. Yoğun dönemlerde bu
                    süre 48 saate kadar uzayabilir.
                </p>

                <h2>6. İlan Güncelleme ve Düzenleme</h2>
                <ul>
                    <li>İlanlar, acente/rehber paneli üzerinden güncellenebilir.</li>
                    <li>Fiyat ve tarih değişiklikleri anlık olarak yansır.</li>
                    <li>İçerik değişiklikleri yeniden onay sürecinden geçebilir.</li>
                    <li>Geçmiş fiyat değişiklikleri şeffaflık amacıyla kaydedilir.</li>
                </ul>

                <h2>7. İlan Kaldırma ve Askıya Alma</h2>
                <p>UmreBuldum aşağıdaki durumlarda ilanları kaldırma veya askıya alma hakkını saklı tutar:</p>
                <ul>
                    <li>İçerik politikası ihlali</li>
                    <li>Kullanıcı şikâyetleri (doğrulanmış)</li>
                    <li>Sahte veya yanıltıcı bilgi tespiti</li>
                    <li>Acente/rehber belge süresinin dolması</li>
                    <li>Tekrarlayan kural ihlalleri</li>
                    <li>Yasal makamlardan gelen talepler</li>
                </ul>

                <h2>8. Sıralama ve Görünürlük</h2>
                <p>
                    İlanların platformdaki sıralaması, birden fazla faktörün değerlendirildiği bir algoritma ile
                    belirlenir:
                </p>
                <ul>
                    <li>Kullanıcı puanları ve değerlendirmeler</li>
                    <li>İlan kalitesi ve içerik tamamlılığı</li>
                    <li>Acente güvenilirlik skoru</li>
                    <li>Dönüşüm oranları</li>
                    <li>İlan güncelliği</li>
                </ul>
                <p>
                    <em>Not: UmreBuldum, &quot;öne çıkarma&quot; veya &quot;sponsorlu ilan&quot; gibi ücretli sıralama
                        avantajı sunmamaktadır. Tüm ilanlar eşit koşullarda değerlendirilir.</em>
                </p>

                <h2>9. Kredi Sistemi</h2>
                <p>
                    İlan yayınlama ve belirli platform özelliklerinin kullanımı, UmreBuldum kredi sistemi
                    kapsamında değerlendirilir. Kredi harcama ve kazanma kuralları{" "}
                    <Link href="/terms" className="text-primary hover:underline">Kullanım Koşulları</Link>&apos;nda
                    detaylı olarak açıklanmıştır.
                </p>

                <h2>10. Yaptırımlar</h2>
                <p>Kural ihlallerinde kademeli yaptırımlar uygulanır:</p>
                <div className="overflow-x-auto">
                    <table>
                        <thead>
                            <tr>
                                <th>İhlal Seviyesi</th>
                                <th>Yaptırım</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>İlk İhlal</td>
                                <td>Yazılı uyarı + ilan düzeltme talebi</td>
                            </tr>
                            <tr>
                                <td>İkinci İhlal</td>
                                <td>İlan kaldırma + 7 gün ilan yayınlama yasağı</td>
                            </tr>
                            <tr>
                                <td>Üçüncü İhlal</td>
                                <td>İlan kaldırma + 30 gün ilan yayınlama yasağı</td>
                            </tr>
                            <tr>
                                <td>Ağır İhlal</td>
                                <td>Hesap kalıcı olarak kapatılır</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2>11. İletişim</h2>
                <p>
                    İlan yayınlama şartları hakkında sorularınız için{" "}
                    <a href="mailto:ilan@umrebuldum.com" className="text-primary hover:underline">ilan@umrebuldum.com</a>{" "}
                    adresinden veya{" "}
                    <Link href="/contact" className="text-primary hover:underline">İletişim sayfamızdan</Link>{" "}
                    bize ulaşabilirsiniz.
                </p>

                <div className="mt-8 rounded-lg border bg-muted/50 p-6">
                    <h3 className="text-lg font-semibold mb-2">İlgili Belgeler</h3>
                    <ul className="space-y-1 list-none pl-0">
                        <li>
                            <Link href="/terms" className="text-primary hover:underline">→ Kullanım Koşulları</Link>
                        </li>
                        <li>
                            <Link href="/privacy" className="text-primary hover:underline">→ Gizlilik Politikası</Link>
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
