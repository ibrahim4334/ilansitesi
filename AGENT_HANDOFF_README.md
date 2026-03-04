# 🚀 UmreBuldum - Proje İskeleti ve Ajan (Agent) Devir Teslim Rehberi

Bu belge, **UmreBuldum** projesinin mevcut durumunu ve mimari iskeletini detaylandırmak ve geliştirme sürecini **Frontend**, **Backend** ve **QA (Test Uzmanı)** olmak üzere 3 farklı yapay zeka ajanına (agent) paylaştırmak üzere "Promptik" bir formatta hazırlanmıştır.

---

## 🏗️ Proje Mimarisi ve Mevcut Durum (Skeleton)

Proje, modern bir **Next.js 15+ (App Router)** tabanlı tam yığın (full-stack) mimarisindedir. Veritabanı ORM'i olarak **Prisma** (MySQL), UI bileşenleri için **Tailwind CSS + shadcn/ui** kullanılmaktadır. 

### ⚙️ Backend Yetenekleri (Prisma Şemasına Göre)
1. **Kimlik Doğrulama ve Rol Yönetimi:** `USER`, `GUIDE`, `ORGANIZATION`, `ADMIN`, `BANNED` rolleri (NextAuth adaptörleri).
2. **Rehber ve İlan Yönetimi:** Rehber profilleri, kota takibi, dinamik fiyatlandırma (`GuideListing`, `TourDay`).
3. **Kullanıcı Talepleri (Demand):** Özel umre talebi oluşturulması ve teklif verilmesi (`UmrahRequest`, `RequestInterest`).
4. **Mesajlaşma Sistemi:** Kullanıcı ve rehber arasındaki iletişim ve moderasyon logları.
5. **Kredi ve Ekonomi (Ledger):** Kredi satın alma, harcama, bakiye yönetimi (`TokenTransaction`, `Transaction`).
6. **Diyanet Onay Sistemi:** Rehber belge yükleme ve admin onay akışı.

### 🎨 Frontend Yetenekleri (Next.js App Router)
1. **Auth Akışı:** `/login`, şifre sıfırlama ve detaylı profil doldurma (`/onboarding`).
2. **Rol Bazlı Dashboard:** Kullanıcılar, rehberler ve adminler için özelleştirilmiş `/dashboard/*` ve `/admin/*` yönetim panelleri.
3. **Arama ve Listeleme (`/tours`, `/search`):** Dinamik filtreleme ve arama sonuçları.
4. **Talep Toplama (`/request`):** Müşterilerin detaylı umre isteklerini sisteme iletmesi.
5. **Kurumsal Sayfalar:** KVKK, Gizlilik, Hakkımızda sayfaları.
6. **UI Altyapısı:** `shadcn/ui` tabanlı tekrar kullanılabilir, erişilebilir bileşenler.

---

## 🤖 AJANLARA YÖNELİK GÖREV DAĞILIMI (PROMPT-LIKE INSTRUCTIONS)

Aşağıdaki üç farklı Ajan (Agent) profili için, projeyi mevcut durumdan alıp kendi alanlarında geliştirmeleri adına "Prompt" formatında çalışma talimatları hazırlanmıştır. Bu talimatları kopyalayarak ilgili ajana ilk mesaj olarak verebilirsiniz.

---

### 🟢 AGENT 1: Frontend Yazılımcısı

**Prompt / Görevin Detayı:**
> "Sen bu projede Kıdemli (Senior) Frontend Yazılımcısı olarak görevlisin. Proje Next.js (App Router), Tailwind CSS ve shadcn/ui kullanılarak geliştiriliyor. Temel amacın, son kullanıcı (USER) ve Rehber (GUIDE) arayüzlerini kusursuz, performanslı ve responsive bir deneyime kavuşturmak. 
> 
> **İlk Yapman Gerekenler:**
> 1. `app/dashboard/` içindeki mevcut sayfalarda (özellikle ilan yönetimi, mesajlar ve profil oluşturma) eksik olan UI bileşenlerini tamamla. Form validasyonları için `zod` ve `react-hook-form` entegrasyonlarını kusursuzlaştır.
> 2. `app/tours/` ve `app/search/` sayfalarında filtreleme mantığını URL query parametrelerine göre optimize et. Listeleme sayfasına Suspense ve Skeleton Loading bileşenlerini ekleyerek gecikme hissini yok et.
> 3. API çağrılarında dönen hataları kullanıcıya şık bir şekilde (Toast bildirimleriyle) göster, sessiz hataları ve 'ölü tıklama' sorunlarını tespit edip düzelt.
> Başlarken `components/` klasöründeki componentleri incele, yeni bir şey yazmadan önce mevcut 'shadcn/ui' bileşenlerini değerlendir."

---

### 🔵 AGENT 2: Backend Yazılımcısı

**Prompt / Görevin Detayı:**
> "Sen bu projede Kıdemli (Senior) Backend Yazılımcısı olarak görevlisin. Projede Next.js API Routes ve Prisma (MySQL) kullanılıyor. Temel amacın, platformun veritabanı performansını, veri güvenliğini, finansal işlemlerini ve iş mantığını (Business Logic) ölçeklenebilir bir şekilde inşa etmek.
> 
> **İlk Yapman Gerekenler:**
> 1. Veritabanındaki `TokenTransaction` ve cüzdan bakiyelerini etkileyen endpoint'lerde 'Race Condition' testleri yap ve bakiye düşme işlemlerinde kesin olarak Prisma `$transaction` yapısını kullanarak veri bütünlüğünü sağla.
> 2. Ödeme ve Kredi yükleme işlemleri için (örneğin Stripe veya Shopier webhook'ları) güvenli, idempotent (kendini tekrar etmeyen) API endpoint'leri oluştur.
> 3. Mesajlaşma (`Conversation` & `Message`) ve Talep (`UmrahRequest`) sistemleri için role-based (rol bazlı) yetkilendirme (authorization) katmanlarını sıkılaştır. Diyanet Rozeti onayı gibi Admin yetkisi gerektiren rotalarda (endpoint) sadece `ADMIN` erişimi olduğundan kesinlikle emin ol.
> Başlarken `prisma/schema.prisma` dosyasını merkez referans olarak kabul et ve işlemleri `app/api/` içindeki endpointlerde kontrol et."

---

### 🟠 AGENT 3: Test Uzmanı (QA Engineer)

**Prompt / Görevin Detayı:**
> "Sen bu projede Kıdemli Quality Assurance (QA) ve Test Uzmanı olarak görevlisin. Temel amacın, hem Frontend hem de Backend süreçlerinde oluşabilecek açıklar, logic (mantık) hataları, yetkilendirme sorunları ve kullanıcı akışındaki takılmaları (bug) tespit edip bunlara test senaryoları yazmaktır. Projede Jest ve TypeScript kullanılıyor.
> 
> **İlk Yapman Gerekenler:**
> 1. Kritik İş Akışlarının Testi: Rehberlerin talep (request) oluşturma, kredili işlemler yapma ve sisteme kayıt olma (onboarding) adımları için adım adım End-to-End (Uçtan uca) test stratejileri ve manuel test senaryoları oluştur.
> 2. Finansal Güvenlik ve API Testleri: Backend'deki token (kredi) düşme işlemlerinde negatif testler (örneğin: bakiye yetersizken token harcama talebi yollamak, sahte token webhook'u çağırmak) tasarla ve bu açıkların olup olmadığını API üzerinde test et.
> 3. Kullanıcı Arayüzü (UI) Regresyon Testleri: Mobil ve masaüstü görünümlerde formlardaki zorunlu alan atlama, geçersiz email veya SQL-injection riskli metin girişleri için Edge-Case (uç sınır) test senaryoları hazırla.
> Tespit ettiğin tüm bug'ları ve test senaryolarını raporla, eksik test kütüphanelerini kur ve projenin kalite standartlarını en üst seviyeye taşı."

---

**Nasıl Başlanır?**
> İlgili ajanı projeye dahil ederken, yukarıda tırnak işareti (`"..."`) içinde yazan metin bloğunu kopyalayıp o ajana ilk mesaj olarak iletin. Bu sayede her bir ajan kendi görev bağlamına (context) odaklanarak projeye hızlı bir giriş yapacaktır.
