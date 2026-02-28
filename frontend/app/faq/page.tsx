import { Metadata } from "next"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
    title: "Sıkça Sorulan Sorular | Umrebuldum",
    description: "Umre turları, rezervasyon süreçleri, vize işlemleri ve ödeme seçenekleri hakkında merak ettiğiniz tüm soruların cevapları.",
}

export default function FAQPage() {
    return (
        <div className="container py-12 md:py-16 lg:py-20 max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Sıkça Sorulan Sorular</h1>
                <p className="text-xl text-muted-foreground">
                    Aklınıza takılan soruların cevaplarını burada bulabilirsiniz.
                </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>Umrebuldum üzerinden rezervasyon yapmak güvenli mi?</AccordionTrigger>
                    <AccordionContent>
                        Evet. Platformumuzda listelenen tüm acenteler kapsamlı doğrulama süreçleri ve TÜRSAB onaylı, lisanslı kuruluşlardır. Ödemeleriniz güvenli ödeme altyapısı ile korunmaktadır.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>Umre vizemi nasıl alabilirim?</AccordionTrigger>
                    <AccordionContent>
                        Umre vizesi işlemleri, rezervasyon yaptığınız acente tarafından yürütülmektedir. Pasaportunuzu ve gerekli evrakları acenteye teslim etmeniz yeterlidir.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>Turlara neler dahildir?</AccordionTrigger>
                    <AccordionContent>
                        Genellikle uçak biletleri, konaklama, vize işlemleri, transferler ve rehberlik hizmetleri turlara dahildir. Her turun detay sayfasında nelerin dahil olduğu açıkça belirtilmiştir.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger>Rezervasyonumu iptal edebilir miyim?</AccordionTrigger>
                    <AccordionContent>
                        İptal ve iade koşulları, seçtiğiniz tura ve acentenin politikalarına göre değişiklik göstermektedir. Rezervasyon yapmadan önce turun iptal şartlarını incelemenizi öneririz.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                    <AccordionTrigger>Çocuklar için indirim var mı?</AccordionTrigger>
                    <AccordionContent>
                        Evet, genellikle 0-2 yaş ve 2-11 yaş arası çocuklar için acenteler tarafından özel indirimler uygulanmaktadır.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                    <AccordionTrigger>Ödeme seçenekleri nelerdir?</AccordionTrigger>
                    <AccordionContent>
                        Kredi kartı ile taksitli ödeme veya banka havalesi seçenekleri mevcuttur. Bazı turlarda ön ödeme ile rezervasyon yapma imkanı da sunulmaktadır.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
