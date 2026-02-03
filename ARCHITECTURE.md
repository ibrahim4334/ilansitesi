# 🏗️ Umrebuldum.com - Hibrit SaaS Mimari Dökümanı

**Versiyon:** 1.0.0  
**Tarih:** 2026-02-03

---

## 📊 Mimari Genel Bakış

```
┌──────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                     │
├─────────────────┬─────────────────┬──────────────────────────────────┤
│   Web Browser   │   Mobile App    │   WhatsApp Bot                   │
│   (WordPress)   │   (React Native)│   (Node.js)                      │
└────────┬────────┴────────┬────────┴─────────────┬────────────────────┘
         │                 │                      │
         ▼                 ▼                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Nginx)                                │
│         ┌─────────────────────────────────────────────────┐          │
│         │  SSL Termination │ Rate Limit │ Load Balance    │          │
│         └─────────────────────────────────────────────────┘          │
│                                                                       │
│   /                    → WordPress (Port 80)                          │
│   /api/poster/*        → Poster Service (Port 8001)                  │
│   /api/mobile/*        → Mobile API (Port 8002)                      │
│   /api/bot/*           → Bot Service (Port 8003)                     │
└──────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       MICROSERVICES                                   │
├──────────────────┬──────────────────┬────────────────────────────────┤
│                  │                  │                                 │
│   WORDPRESS      │   POSTER         │   NOTIFICATION                  │
│   ┌──────────┐   │   SERVICE        │   SERVICE                       │
│   │HivePress │   │   ┌──────────┐   │   ┌────────────┐               │
│   │WooCommerce│  │   │FastAPI   │   │   │WhatsApp API│               │
│   │REST API  │   │   │Pillow    │   │   │Firebase    │               │
│   │JWT Auth  │   │   │Celery    │   │   │Email       │               │
│   └──────────┘   │   └──────────┘   │   └────────────┘               │
│        ↓         │        ↓         │         ↓                       │
│     MySQL        │     Redis        │      Redis                      │
│                  │     S3/CDN       │                                 │
└──────────────────┴──────────────────┴────────────────────────────────┘
```

---

## 1️⃣ WordPress İÇİNDE Kalan Bileşenler

| Bileşen | Teknoloji | Neden WordPress? |
|---------|-----------|------------------|
| **İlan CRUD** | HivePress | Zaten optimize, admin UI hazır |
| **Kullanıcı Auth** | WP + JWT | Tüm sistemin merkezi auth |
| **Ödeme Sistemi** | WooCommerce + Shopier | Entegrasyon hazır |
| **CMS** | WordPress Core | Blog, sayfalar, SEO |
| **Admin Panel** | WP-Admin | Kullanıcı dostu |
| **Affiliate Tracking** | Özel Plugin | WP session entegrasyonu |

### Korunan Optimizasyonlar

```
✅ wp-config.php  → Bellek limiti, güvenlik
✅ .htaccess      → Sunucu güvenlik kuralları
✅ mu-plugins     → Performans optimizasyonları
✅ HivePress      → İlan sistemi core
```

---

## 2️⃣ WordPress DIŞINA Alınan Bileşenler

### A. Poster Service (Python/FastAPI)

**Konum:** `services/poster-service/`

```
poster-service/
├── main.py              # FastAPI app
├── poster_generator.py  # Pillow image generation
├── requirements.txt     # Dependencies
├── fonts/              # Custom fonts
├── templates/          # Poster templates
└── Dockerfile
```

**Endpoint'ler:**
- `POST /api/v1/generate` → Afiş üret
- `GET /api/v1/status/{job_id}` → Durum kontrolü
- `POST /api/v1/webhook/listing` → WP webhook

### B. Notification Service (Node.js)

```
notification-service/
├── src/
│   ├── whatsapp/      # Baileys entegrasyonu
│   ├── firebase/      # Push notifications
│   └── email/         # Transactional emails
├── package.json
└── Dockerfile
```

### C. Mobile API Gateway (Optional)

```
mobile-api/
├── src/
│   ├── auth/          # JWT validation
│   ├── listings/      # Listing endpoints
│   └── users/         # User endpoints
├── package.json
└── Dockerfile
```

---

## 3️⃣ REST API Stratejisi

### WordPress API (HivePress Extended)

```php
// Mevcut endpoint'ler (HivePress)
GET  /wp-json/hivepress/v1/listings
GET  /wp-json/hivepress/v1/listings/{id}
POST /wp-json/hivepress/v1/listings
PUT  /wp-json/hivepress/v1/listings/{id}

// Özel endpoint'ler (Eklenti ile)
POST /wp-json/umrebuldum/v1/auth/login      → JWT token
POST /wp-json/umrebuldum/v1/auth/register   → Yeni kullanıcı
GET  /wp-json/umrebuldum/v1/user/profile    → Profil bilgisi
GET  /wp-json/umrebuldum/v1/user/listings   → Kullanıcı ilanları
```

### JWT Authentication Flow

```
1. Mobile App → POST /wp-json/umrebuldum/v1/auth/login
   Body: { email, password }
   
2. WordPress validates credentials
   
3. Response: { token: "eyJhbG...", user: {...} }
   
4. Mobile App stores JWT
   
5. All further requests:
   Header: Authorization: Bearer eyJhbG...
```

---

## 4️⃣ WhatsApp Chatbot Mimarisi

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  WhatsApp   │────▶│  Bot Service     │────▶│  WordPress   │
│  User       │◀────│  (Node.js)       │◀────│  REST API    │
└─────────────┘     │  ┌────────────┐  │     └──────────────┘
                    │  │ Baileys    │  │
                    │  │ NLP/Intent │  │     ┌──────────────┐
                    │  │ Flow Logic │  │────▶│  Poster      │
                    │  └────────────┘  │     │  Service     │
                    └──────────────────┘     └──────────────┘
```

**Bot Komutları:**
- `/ilan <kategori>` → İlan ara
- `/yeni` → Yeni ilan başlat
- `/durum <id>` → İlan durumu
- `/afis <id>` → Afiş indir

---

## 5️⃣ Affiliate & Premium Model

### Veritabanı Tabloları (WordPress)

```sql
-- Affiliate tablosu
CREATE TABLE qll5_affiliate_partners (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    code VARCHAR(20) UNIQUE,
    commission_rate DECIMAL(5,2),
    total_earnings DECIMAL(10,2),
    status ENUM('active','pending','suspended'),
    created_at DATETIME
);

-- Referral tracking
CREATE TABLE qll5_affiliate_referrals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    partner_id BIGINT,
    referred_user_id BIGINT,
    listing_id BIGINT,
    commission DECIMAL(10,2),
    status ENUM('pending','approved','paid'),
    created_at DATETIME
);
```

### Premium Paketler (WooCommerce Products)

| Paket | Fiyat | Özellikler |
|-------|-------|------------|
| **Temel** | Ücretsiz | 3 ilan/ay, standart afiş |
| **Plus** | 99 TL/ay | 20 ilan/ay, premium afişler, öne çıkarma |
| **Pro** | 249 TL/ay | Sınırsız ilan, tüm afişler, API erişimi |
| **Kurumsal** | Özel | White-label, özel tasarım |

---

## 6️⃣ Deployment Stratejisi

### Development

```yaml
# docker-compose.dev.yml
services:
  wordpress:
    image: wordpress:latest
    ports: ["8080:80"]
    volumes:
      - ./wp-content:/var/www/html/wp-content
    
  poster-service:
    build: ./services/poster-service
    ports: ["8001:8001"]
    
  redis:
    image: redis:alpine
    ports: ["6379:6379"]
```

### Production

```
┌─────────────────────────────────────┐
│           Cloudflare CDN            │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│        Nginx (Load Balancer)        │
└───────────────┬─────────────────────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
┌───────┐ ┌─────────┐ ┌──────────┐
│  WP   │ │ Poster  │ │   Bot    │
│Server │ │ Service │ │ Service  │
└───────┘ └─────────┘ └──────────┘
    │           │           │
    └─────────┬─┴───────────┘
              ▼
       ┌──────────┐
       │  MySQL   │
       │  Redis   │
       │  S3      │
       └──────────┘
```

---

## 7️⃣ Dosya Yapısı

```
umrebuldum/
├── wp-content/
│   ├── plugins/
│   │   ├── umrebuldum-poster-integration/  ✅ Yeni
│   │   ├── umrebuldum-mobile-api/          ✅ Yeni
│   │   ├── umrebuldum-affiliate/           ✅ Yeni
│   │   └── hivepress/                      Mevcut
│   ├── mu-plugins/
│   │   └── umrebuldum-optimizer.php        ✅ Mevcut
│   └── themes/
│       └── listinghive/                    Mevcut
│
├── services/                               ✅ Yeni
│   ├── poster-service/
│   │   ├── main.py
│   │   ├── poster_generator.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── notification-service/
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── docker-compose.yml
│
├── mobile-app/                             ✅ Gelecek
│   └── (React Native)
│
├── OPTIMIZATION_README.md
├── ARCHITECTURE.md                         ✅ Bu dosya
└── docker-compose.yml
```

---

## 8️⃣ Uygulama Öncelikleri

### Faz 1: Temel (1-2 Hafta)
- [x] WordPress optimizasyonu
- [x] Poster service yapısı
- [ ] WP-Poster entegrasyon testi
- [ ] Redis kurulumu

### Faz 2: Afiş Sistemi (2-3 Hafta)
- [ ] Poster generator geliştirme
- [ ] Template sistemi
- [ ] S3/CDN entegrasyonu
- [ ] Admin panel

### Faz 3: API & Mobil (3-4 Hafta)
- [ ] JWT authentication
- [ ] Mobile API endpoints
- [ ] React Native app başlangıç

### Faz 4: WhatsApp Bot (2-3 Hafta)
- [ ] Baileys entegrasyonu
- [ ] Intent recognition
- [ ] Conversation flows

### Faz 5: Premium & Affiliate (2-3 Hafta)
- [ ] WooCommerce subscription
- [ ] Affiliate tracking
- [ ] Payment integration

---

## 📞 İletişim Noktaları

| Servis | Port | Endpoint |
|--------|------|----------|
| WordPress | 80/443 | umrebuldum.com |
| Poster Service | 8001 | api.umrebuldum.com/poster |
| Notification | 8003 | api.umrebuldum.com/notify |
| Mobile API | 8002 | api.umrebuldum.com/mobile |

---

**Hazırlayan:** Umrebuldum Architecture Team  
**Son Güncelleme:** 2026-02-03
