import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function KVKKPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8">Kişisel Verilerin Korunması ve İşlenmesi Politikası (KVKK)</h1>

                <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900">1. Amaç ve Kapsam</h2>
                        <p>
                            UmreBuldum ("Platform") olarak, kullanıcılarımızın kişisel verilerinin güvenliğini önemsiyoruz.
                            Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, kişisel verilerinizin
                            toplanma şekli, işlenme amaçları, aktarıldığı kişiler ve haklarınız konusunda sizi bilgilendirmek amacıyla hazırlanmıştır.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900">2. İşlenen Kişisel Veriler</h2>
                        <p>Platformumuzda aşağıdaki kişisel verileriniz işlenebilmektedir:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Kimlik Bilgileri:</strong> Ad, soyad.</li>
                            <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası, şehir.</li>
                            <li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, şifre bilgileri, giriş-çıkış kayıtları.</li>
                            <li><strong>Talep ve Şikayet Bilgileri:</strong> Oluşturduğunuz umre talepleri, mesajlaşma içerikleri.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900">3. Kişisel Verilerin İşlenme Amaçları</h2>
                        <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Üyelik işlemlerinin gerçekleştirilmesi.</li>
                            <li>Hizmetlerin (umre turu bulma, rehberlerle iletişim) sunulması.</li>
                            <li>İletişim faaliyetlerinin yürütülmesi.</li>
                            <li>Yasal yükümlülüklerin yerine getirilmesi.</li>
                            <li>Talep ve şikayetlerin takibi.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900">4. Kişisel Verilerin Aktarılması</h2>
                        <p>
                            Kişisel verileriniz, yasal düzenlemelerin öngördüğü kapsamda ve yukarıda belirtilen amaçlarla;
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Yetkili kamu kurum ve kuruluşlarına,</li>
                            <li>Hizmet aldığımız tedarikçilere (sunucu hizmetleri vb.),</li>
                            <li><strong>Açık rızanız olması halinde;</strong> talep oluşturduğunuz turların rehberlerine ve tur şirketlerine iletişim amacıyla aktarılabilir.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900">5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
                        <p>
                            Kişisel verileriniz, platformumuz üzerinden elektronik ortamda (web sitesi, mobil uygulama formları) toplanmaktadır.
                            Bu veriler, "sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması kaydıyla" ve "ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması" hukuki sebeplerine dayanarak işlenmektedir.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900">6. Veri Sahibinin Hakları</h2>
                        <p>KVKK'nın 11. maddesi uyarınca, veri sahipleri aşağıdaki haklara sahiptir:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Kişisel veri işlenip işlenmediğini öğrenme,</li>
                            <li>Kişisel verileri işlenmişse buna ilişkin bilgi talep etme,</li>
                            <li>Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
                            <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,</li>
                            <li>Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900">7. İletişim</h2>
                        <p>
                            KVKK kapsamındaki haklarınızı kullanmak ve talepleriniz için bize <a href="mailto:info@umrebuldum.com" className="text-blue-600 hover:underline">info@umrebuldum.com</a> adresinden ulaşabilirsiniz.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
