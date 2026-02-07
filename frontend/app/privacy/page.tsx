import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Gizlilik Politikası | Umrebuldum",
    description: "Kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgileri içeren gizlilik politikamız.",
}

export default function PrivacyPage() {
    return (
        <div className="container py-12 md:py-16 lg:py-20 max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Gizlilik Politikası</h1>
                <p className="text-xl text-muted-foreground">
                    Verilerinizin güvenliği bizim için önemlidir.
                </p>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-sm text-muted-foreground">Son Güncelleme: 05 Şubat 2026</p>

                <h2>1. Giriş</h2>
                <p>
                    Umrebuldum ("Biz", "Şirketim") olarak, ziyaretçilerimizin ve kullanıcılarımızın gizliliğine saygı duyuyoruz. Bu Gizlilik Politikası, web sitemizi kullandığınızda kişisel verilerinizin nasıl işlendiğini açıklamaktadır.
                </p>

                <h2>2. Toplanan Veriler</h2>
                <p>
                    Aşağıdaki türde bilgileri toplayabiliriz:
                </p>
                <ul>
                    <li>Kimlik Bilgileri (Ad, Soyad)</li>
                    <li>İletişim Bilgileri (E-posta adresi, Telefon numarası)</li>
                    <li>İşlem Güvenliği Bilgileri (IP adresi, Log kayıtları)</li>
                    <li>Kullanıcı İşlem Bilgileri (Rezervasyon detayları)</li>
                </ul>

                <h2>3. Verilerin Kullanım Amacı</h2>
                <p>
                    Topladığımız verileri şu amaçlarla kullanıyoruz:
                </p>
                <ul>
                    <li>Hizmetlerimizi sunmak ve rezervasyon işlemlerini gerçekleştirmek.</li>
                    <li>Müşteri desteği sağlamak.</li>
                    <li>Yasal yükümlülüklerimizi yerine getirmek.</li>
                    <li>Hizmet kalitemizi artırmak ve analiz yapmak.</li>
                </ul>

                <h2>4. Çerezler (Cookies)</h2>
                <p>
                    Web sitemizde kullanıcı deneyimini geliştirmek için çerezler kullanmaktayız. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.
                </p>

                <h2>5. Veri Güvenliği</h2>
                <p>
                    Kişisel verilerinizi korumak için endüstri standardı güvenlik önlemleri uyguluyoruz. Verileriniz, yasal zorunluluklar dışında üçüncü şahıslarla paylaşılmamaktadır.
                </p>

                <h2>6. Haklarınız</h2>
                <p>
                    KVKK kapsamında verilerinizin silinmesini, düzeltilmesini veya bilgi talep etme hakkına sahipsiniz. Talepleriniz için bizimle iletişime geçebilirsiniz.
                </p>

                <h2>7. İletişim</h2>
                <p>
                    Gizlilik politikamızla ilgili sorularınız için <a href="mailto:info@umrebuldum.com">info@umrebuldum.com</a> adresinden bize ulaşabilirsiniz.
                </p>
            </div>
        </div>
    )
}
