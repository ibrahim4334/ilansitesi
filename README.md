# 🕋 Umrebuldum - Umre Tur Karşılaştırma Platformu

<div align="center">

![Umrebuldum](https://img.shields.io/badge/Umrebuldum-Umre%20Platformu-1e3a5f?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-Proprietary-red?style=for-the-badge)

**Türkiye'nin ilk ve en kapsamlı Umre tur karşılaştırma platformu**

[Demo](#) • [Dokümantasyon](#-dokümantasyon) • [Kurulum](#-kurulum) • [İletişim](#-iletişim)

</div>

---

## 📋 İçindekiler

- [Proje Hakkında](#-proje-hakkında)
- [Ana Özellikler](#-ana-özellikler)
- [Teknik Mimari](#-teknik-mimari)
- [Dizin Yapısı](#-dizin-yapısı)
- [Kurulum](#-kurulum)
- [Frontend (Next.js)](#-frontend-nextjs)
- [Backend (WordPress)](#-backend-wordpress)
- [WordPress Eklentileri](#-wordpress-eklentileri)
- [API Referansı](#-api-referansı)
- [Pro Monetizasyon](#-pro-monetizasyon)
- [Yol Haritası](#-yol-haritası)

---

## 🎯 Proje Hakkında

**Umrebuldum**, kullanıcıların farklı seyahat acentelerinin Umre turlarını tek platformda karşılaştırmasını, fiyat/hizmet analizi yapmasını ve doğrudan rezervasyon talebinde bulunmasını sağlayan kapsamlı bir dijital platformdur.

### Hedef Kitle

| Kullanıcı Tipi | Açıklama |
|----------------|----------|
| **Gezginler** | Umre yapmak isteyen bireyler ve aileler |
| **Organizatörler** | TÜRSAB lisanslı seyahat acenteleri |
| **Adminler** | Platform yöneticileri |

### Problem & Çözüm

```
❌ PROBLEM                          ✅ ÇÖZÜM
─────────────────────────────────────────────────────────────
Dağınık tur bilgileri      →   Tek platformda tüm turlar
Fiyat karşılaştırma zorluğu →   Anlık fiyat/özellik karşılaştırma
Güvenilirlik endişesi      →   Doğrulanmış organizatörler
İletişim kopukluğu         →   Talep & Yanıt sistemi
Offline erişim yok         →   Offline HTML tur planı
```

---

## ✨ Ana Özellikler

### 👤 Kullanıcılar İçin

| Özellik | Açıklama |
|---------|----------|
| 🔍 **Tur Arama** | Tarih, bütçe, konum bazlı gelişmiş filtreleme |
| 📊 **Karşılaştırma** | Yan yana tur karşılaştırma tablosu |
| 📝 **Talep Gönderme** | Özel tur talebi oluşturma |
| 💬 **Mesajlaşma** | Organizatörlerle direkt iletişim |
| 📄 **Offline Plan** | Tur planını PDF/HTML olarak indirme |
| 🆘 **Acil Yardım** | Çok dilli kayboldum ekranı |

### 👔 Organizatörler İçin

| Özellik | Açıklama |
|---------|----------|
| 📋 **Dashboard** | KPI'lar, istatistikler, grafikler |
| 🎨 **Afiş Oluşturucu** | AI destekli sosyal medya afişleri |
| 📨 **Talep Yönetimi** | Gelen talepleri görme ve yanıtlama |
| 📈 **Analitik** | Görüntülenme, tıklama, dönüşüm |
| ⭐ **Premium Özellikler** | Öne çıkan ilan, öncelikli sıralama |

### 🛡️ Adminler İçin

| Özellik | Açıklama |
|---------|----------|
| ✅ **İlan Moderasyonu** | Yeni ilanları onaylama/reddetme |
| 👥 **Kullanıcı Yönetimi** | Organizatör doğrulama |
| 📊 **Platform Analitiği** | Genel istatistikler |
| 💰 **Gelir Takibi** | Abonelik ve komisyon yönetimi |

---

## 🏗️ Teknik Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                         KULLANICI                               │
│                    (Tarayıcı / Mobil)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 14)                      │
│  ┌───────────────┬───────────────┬───────────────────────────┐  │
│  │   Ana Sayfa   │   Tur Liste   │   Organizatör Dashboard   │  │
│  │   Arama       │   Detay       │   Talep Yönetimi          │  │
│  │   Kayıt/Giriş │   Karşılaştır │   Afiş Oluşturucu         │  │
│  └───────────────┴───────────────┴───────────────────────────┘  │
│                                                                 │
│  Tech: React, TypeScript, TailwindCSS, Zustand                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API / GraphQL
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (WordPress + HivePress)              │
│  ┌───────────────┬───────────────┬───────────────────────────┐  │
│  │   HivePress   │   Custom      │   WooCommerce             │  │
│  │   Core        │   Plugins     │   (Ödeme)                 │  │
│  └───────────────┴───────────────┴───────────────────────────┘  │
│                                                                 │
│  Custom Plugins:                                                │
│  • hivepress-listing-requests (Talep Sistemi)                   │
│  • umrebuldum-poster-generator (Afiş Oluşturucu)                │
│  • umrebuldum-tour-export (Offline HTML Export)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         VERİTABANI                              │
│                       (MySQL / MariaDB)                         │
│  ┌───────────────┬───────────────┬───────────────────────────┐  │
│  │   wp_posts    │   wp_users    │   wp_postmeta             │  │
│  │   (listings)  │   (vendors)   │   (custom fields)         │  │
│  └───────────────┴───────────────┴───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript, TailwindCSS |
| **State Management** | Zustand, React Query |
| **Backend** | WordPress 6.x, PHP 8.1+ |
| **Plugin Framework** | HivePress |
| **Database** | MySQL 8.0 / MariaDB |
| **Auth** | WordPress REST API + JWT |
| **Hosting** | LAMP/LEMP Stack |

---

## 📁 Dizin Yapısı

```
umrebuldum/
│
├── 📁 frontend/                          # Next.js Frontend Uygulaması
│   ├── 📁 app/                           # App Router sayfaları
│   │   ├── 📁 dashboard/                 # Organizatör dashboard
│   │   │   ├── page.tsx                  # Ana dashboard
│   │   │   ├── listings/page.tsx         # İlan yönetimi
│   │   │   └── analytics/page.tsx        # Analitik
│   │   ├── layout.tsx
│   │   └── page.tsx                      # Ana sayfa
│   │
│   ├── 📁 components/                    # React bileşenleri
│   │   ├── 📁 dashboard/                 # Dashboard bileşenleri
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── StatCards.tsx
│   │   │   ├── RequestCard.tsx
│   │   │   ├── ListingCard.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── AnalyticsCharts.tsx
│   │   │   └── RevenueCards.tsx
│   │   │
│   │   ├── 📁 monetization/              # Pro özellikleri
│   │   │   ├── ProFeatures.tsx           # Badge'ler, pricing
│   │   │   └── UpgradePrompts.tsx        # Upsell UI
│   │   │
│   │   └── 📁 ui/                        # Temel UI bileşenleri
│   │
│   ├── 📁 docs/                          # Frontend dokümantasyonu
│   │   ├── ORGANIZER_DASHBOARD_UX.md
│   │   └── PRO_MONETIZATION_UX.md
│   │
│   ├── API_REFERENCE.md                  # API kullanım kılavuzu
│   ├── api-endpoints.json                # API endpoint listesi
│   ├── package.json
│   └── tailwind.config.js
│
├── 📁 wp-content/                        # WordPress İçeriği
│   │
│   ├── 📁 plugins/
│   │   │
│   │   ├── 📁 hivepress/                 # HivePress Core (3rd party)
│   │   │
│   │   ├── 📁 hivepress-listing-requests/  # 🆕 Talep Sistemi Eklentisi
│   │   │   ├── hivepress-listing-requests.php
│   │   │   ├── README.md
│   │   │   ├── 📁 includes/
│   │   │   │   ├── class-listing-request.php          # Model
│   │   │   │   ├── class-listing-request-controller.php # Controller
│   │   │   │   └── class-listing-request-form.php     # Forms
│   │   │   └── 📁 templates/
│   │   │       ├── listing-request-submit-page.php
│   │   │       ├── listing-requests-view-page.php
│   │   │       ├── listing-request-view-page.php
│   │   │       └── listing-request-view-block.php
│   │   │
│   │   ├── 📁 umrebuldum-poster-generator/  # 🆕 Afiş Oluşturucu
│   │   │   ├── umrebuldum-poster-generator.php
│   │   │   └── 📁 includes/
│   │   │       └── class-rest-api.php
│   │   │
│   │   └── 📁 umrebuldum-tour-export/      # 🆕 Offline Export
│   │       ├── umrebuldum-tour-export.php
│   │       ├── README.md
│   │       └── 📁 templates/
│   │           ├── offline-tour.php        # HTML template + Acil Yardım
│   │           └── admin-page.php
│   │
│   └── 📁 themes/
│       └── 📁 flavor/                    # HivePress tema
│
└── 📄 README.md                          # Bu dosya
```

---

## 🚀 Kurulum

### Gereksinimler

- PHP 8.1+
- MySQL 8.0+ / MariaDB 10.5+
- Node.js 18+
- Composer
- WordPress 6.0+

### 1. WordPress Backend Kurulumu

```bash
# WordPress'i kur
# wp-config.php ayarlarını yap

# Eklentileri aktive et
wp plugin activate hivepress
wp plugin activate hivepress-listing-requests
wp plugin activate umrebuldum-poster-generator
wp plugin activate umrebuldum-tour-export

# Permalink yapısını güncelle
wp rewrite flush
```

### 2. Frontend Kurulumu

```bash
cd frontend

# Bağımlılıkları yükle
npm install

# Environment dosyasını oluştur
cp .env.example .env.local

# .env.local içeriği:
# NEXT_PUBLIC_API_URL=https://api.umrebuldum.com
# NEXT_PUBLIC_WP_URL=https://admin.umrebuldum.com

# Development server
npm run dev

# Production build
npm run build
npm start
```

---

## 🖥️ Frontend (Next.js)

### Sayfa Yapısı

| Route | Açıklama | Auth |
|-------|----------|------|
| `/` | Ana sayfa, tur arama | ❌ |
| `/turlar` | Tur listesi | ❌ |
| `/turlar/[slug]` | Tur detay | ❌ |
| `/karsilastir` | Karşılaştırma | ❌ |
| `/giris` | Kullanıcı girişi | ❌ |
| `/kayit` | Yeni kayıt | ❌ |
| `/talep-olustur` | Talep formu | ✅ User |
| `/dashboard` | Organizatör paneli | ✅ Vendor |
| `/dashboard/listings` | İlan yönetimi | ✅ Vendor |
| `/dashboard/analytics` | Analitik | ✅ Vendor |
| `/dashboard/requests` | Gelen talepler | ✅ Vendor |

### Temel Componentler

```tsx
// Dashboard Layout
import { DashboardLayout } from '@/components/dashboard';

// Monetization
import { 
  FeaturedBadge, 
  PricingTable, 
  UpgradeBanner 
} from '@/components/monetization';

// Kullanım
<FeaturedBadge type="premium" size="sm" />
<PricingTable />
<UpgradeBanner variant="urgent" discount={20} />
```

---

## 🔌 Backend (WordPress)

### HivePress Konfigürasyonu

HivePress, tur ilanları için temel altyapıyı sağlar:

| Özellik | Açıklama |
|---------|----------|
| `hp_listing` | Tur ilanı post type |
| `hp_vendor` | Organizatör post type |
| `hp_booking` | Rezervasyon sistemi |
| `hp_message` | Mesajlaşma |
| `hp_review` | Değerlendirmeler |

### REST API Endpoints

```
GET  /wp-json/hivepress/v1/listings          # Tüm turlar
GET  /wp-json/hivepress/v1/listings/{id}     # Tek tur
POST /wp-json/hivepress/v1/listings          # Yeni tur (vendor)
PUT  /wp-json/hivepress/v1/listings/{id}     # Güncelle

GET  /wp-json/hivepress/v1/listing-requests  # Talepler
POST /wp-json/hivepress/v1/listing-requests  # Yeni talep
POST /wp-json/hivepress/v1/listing-requests/{id}/respond  # Yanıt

POST /wp-json/umrebuldum/v1/poster/generate  # Afiş oluştur
GET  /wp-json/umrebuldum/v1/user/tier        # Kullanıcı planı
```

---

## 🔧 WordPress Eklentileri

### 1. HivePress Listing Requests

**Amaç:** Kullanıcıların özel tur talebi göndermesi, organizatörlerin yanıtlaması.

```php
// Talep oluşturma
$request = new Listing_Request([
    'title'       => 'Aile için Umre paketi arıyorum',
    'destination' => 'both',
    'travel_date' => '2024-03-15',
    'travelers'   => 4,
    'budget_max'  => 3000,
]);
$request->save();
```

**Özellikler:**
- ✅ Talep formu (kullanıcı)
- ✅ Talep listesi (organizatör inbox)
- ✅ Yanıt sistemi (ilan önerisi ile)
- ✅ Admin moderasyonu
- ✅ Email bildirimleri

---

### 2. Umrebuldum Poster Generator

**Amaç:** Organizatörlerin sosyal medya afişleri oluşturması.

```php
// Afiş oluşturma API
POST /wp-json/umrebuldum/v1/poster/generate
{
    "listing_id": 123,
    "template": "ramadan_special",
    "format": "instagram_post"
}
```

**Özellikler:**
- ✅ Çoklu template desteği
- ✅ Instagram, Facebook, Twitter formatları
- ✅ Kullanım kotası (Free/Pro)
- ✅ Cache sistemi

---

### 3. Umrebuldum Tour Export

**Amaç:** Tur planını offline çalışan tek HTML dosyasına dönüştürme.

```php
// Export URL
/wp-admin/admin-ajax.php?action=ute_export_tour&listing_id=123
```

**Özellikler:**
- ✅ Tek dosya HTML (inline CSS)
- ✅ Base64 gömülü görseller
- ✅ Gün gün program
- ✅ Mobil responsive
- ✅ 🆘 Çok dilli Acil Yardım ekranı (TR/EN/AR)
- ✅ Tek dokunuşla rehberi arama

---

## 💰 Pro Monetizasyon

### Kullanıcı Planları

| Plan | Fiyat | Özellikler |
|------|-------|------------|
| **Free** | ₺0/ay | 3 ilan, 5 afiş/ay, standart sıralama |
| **Pro** | ₺199/ay | 15 ilan, sınırsız afiş, öncelikli sıralama |
| **Agency** | ₺499/ay | Sınırsız, maksimum öncelik, öncelikli destek |

### Monetizasyon Noktaları

```
┌─────────────────────────────────────────────────────────────┐
│                     GELİR KAYNAKLARI                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💎 Abonelik                                               │
│     • Pro/Agency aylık planlar                             │
│                                                             │
│  ⭐ Öne Çıkarma                                            │
│     • Featured listing (tek seferlik)                       │
│     • Boost (7 günlük)                                      │
│                                                             │
│  🚀 Talep Önceliklendirme                                  │
│     • Priority request (tek seferlik)                       │
│                                                             │
│  💼 Komisyon                                               │
│     • Başarılı rezervasyondan %X                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 API Referansı

Detaylı API dokümantasyonu için:
- [`frontend/API_REFERENCE.md`](frontend/API_REFERENCE.md)
- [`frontend/api-endpoints.json`](frontend/api-endpoints.json)

### Hızlı Örnekler

```javascript
// Tur listesi çekme
const response = await fetch('/wp-json/hivepress/v1/listings?per_page=10');
const listings = await response.json();

// Talep gönderme
await fetch('/wp-json/hivepress/v1/listing-requests', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        title: 'Umre paketi arıyorum',
        travel_date: '2024-03-15',
        travelers: 2
    })
});
```

---

## 🗺️ Yol Haritası

### ✅ Tamamlanan (v1.0)

- [x] HivePress entegrasyonu
- [x] Tur listeleme ve detay
- [x] Organizatör dashboard
- [x] Talep sistemi
- [x] Afiş oluşturucu
- [x] Offline HTML export
- [x] Acil yardım ekranı
- [x] Pro monetizasyon UI

### 🚧 Devam Eden (v1.1)

- [ ] Ödeme entegrasyonu (Stripe/iyzico)
- [ ] Push notifications
- [ ] Mobil uygulama (React Native)
- [ ] Çoklu dil desteği

### 📋 Planlanan (v2.0)

- [ ] AI tur önerisi
- [ ] Chatbot entegrasyonu
- [ ] Grup tur organizasyonu
- [ ] Rehber değerlendirme sistemi

---

## 📚 Dokümantasyon

| Dosya | İçerik |
|-------|--------|
| [`frontend/API_REFERENCE.md`](frontend/API_REFERENCE.md) | REST API kullanımı |
| [`frontend/docs/ORGANIZER_DASHBOARD_UX.md`](frontend/docs/ORGANIZER_DASHBOARD_UX.md) | Dashboard UX spesifikasyonu |
| [`frontend/docs/PRO_MONETIZATION_UX.md`](frontend/docs/PRO_MONETIZATION_UX.md) | Monetizasyon UX & copy |
| [`wp-content/plugins/hivepress-listing-requests/README.md`](wp-content/plugins/hivepress-listing-requests/README.md) | Talep sistemi hooks |
| [`wp-content/plugins/umrebuldum-tour-export/README.md`](wp-content/plugins/umrebuldum-tour-export/README.md) | Export plugin kullanımı |

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje özel lisans altındadır. Tüm hakları saklıdır.

© 2024 Umrebuldum. All rights reserved.

---

## 📞 İletişim

- **Website:** [umrebuldum.com](https://umrebuldum.com)
- **Email:** info@umrebuldum.com
- **Destek:** destek@umrebuldum.com

---

<div align="center">

**Umrebuldum** ile Umre yolculuğunuz güvenle başlasın 🕋

Made with ❤️ in Türkiye

</div>
