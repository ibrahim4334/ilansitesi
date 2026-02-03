# 🧪 Poster Generator Test Checklist

Production'a geçmeden önce bu testleri mutlaka yap!

## 1️⃣ Cache Sistemi Testleri

### Test 1.1: Cache Hit
```
1. HivePress → Afişler sayfasına git
2. Bir ilan için afiş üret
3. Aynı ilan + aynı template + aynı size ile tekrar üret
4. ✅ BEKLENEN: Response'da "cached": true olmalı
5. ✅ BEKLENEN: 2. istek çok daha hızlı olmalı (<100ms)
```

### Test 1.2: Cache Invalidation
```
1. Bir ilan için afiş üret
2. İlanın BAŞLIĞINI değiştir ve kaydet
3. Aynı ilan için tekrar afiş üret
4. ✅ BEKLENEN: Yeni başlıkla afiş üretilmeli
5. ✅ BEKLENEN: "cached": false olmalı (çünkü modified_time değişti)
```

### Test 1.3: Template ile Ayrı Cache
```
1. Ilan #123 için "default" template ile afiş üret
2. Aynı ilan için "umre" template ile afiş üret
3. ✅ BEKLENEN: İki farklı afiş dosyası oluşmalı
4. ✅ BEKLENEN: Her ikisi de cache'de ayrı tutulmalı
```

---

## 2️⃣ WebP & Memory Testleri

### Test 2.1: WebP Çalışıyor mu?
```
1. Afiş üret
2. wp-content/uploads/posters/cache/ klasörüne bak
3. ✅ BEKLENEN: .webp uzantılı dosya varsa WebP çalışıyor
4. ℹ️ NOT: .png varsa sunucu WebP desteklemiyor (fallback çalışmış)
```

### Test 2.2: Büyük Görsel (Memory Test)
```
1. 4000x3000 piksel veya daha büyük bir görsel yükle
2. Bu görselli ilan için afiş üret
3. ✅ BEKLENEN: Afiş üretilmeli (crash olmamalı)
4. ✅ BEKLENEN: Görsel otomatik küçültülmeli
```

### Test 2.3: Memory Limit Kontrolü
```
1. REST API: GET /wp-json/umrebuldum/v1/poster/status
2. ✅ BEKLENEN: memory.available_mb > 30 olmalı
3. ⚠️ UYARI: <30MB ise afiş üretimi riskli
```

---

## 3️⃣ Rate Limiter Testleri

### Test 3.1: Normal Kullanım
```
1. Logout ol (veya incognito)
2. 10 farklı ilan için afiş üret
3. ✅ BEKLENEN: Hepsi başarılı
```

### Test 3.2: Rate Limit Aşımı
```
1. Logout ol (veya incognito)
2. Aynı IP'den 11. afiş üretmeyi dene
3. ✅ BEKLENEN: HTTP 429 Too Many Requests
4. ✅ BEKLENEN: "retry_after" saniye döndürmeli
```

### Test 3.3: Admin Whitelist
```
1. Admin olarak login ol
2. 15+ afiş üret peş peşe
3. ✅ BEKLENEN: Admin için rate limit YOK
```

---

## 4️⃣ REST API Testleri

### Test 4.1: Generate Endpoint
```bash
# curl ile test (veya Postman)
curl -X POST \
  https://siteniz.com/wp-json/umrebuldum/v1/poster/generate \
  -H "X-WP-Nonce: [nonce]" \
  -d "listing_id=123&template=default&size=instagram"

✅ BEKLENEN: {"success": true, "url": "...", "cached": false}
```

### Test 4.2: Get Poster
```bash
curl https://siteniz.com/wp-json/umrebuldum/v1/poster/123

✅ BEKLENEN: {"success": true, "poster": {...}}
```

### Test 4.3: Templates Listesi
```bash
curl https://siteniz.com/wp-json/umrebuldum/v1/poster/templates

✅ BEKLENEN: {"templates": {...}, "sizes": {...}}
```

### Test 4.4: Status Endpoint
```bash
curl https://siteniz.com/wp-json/umrebuldum/v1/poster/status \
  -H "X-WP-Nonce: [nonce]"

✅ BEKLENEN: generator_ready: true, webp_support: true/false
```

---

## 5️⃣ Stres Testleri (Opsiyonel)

### Test 5.1: Paralel İstekler
```
1. 3 farklı tarayıcı sekmesinde aynı anda afiş üret
2. ✅ BEKLENEN: Hiçbiri timeout olmamalı
3. ✅ BEKLENEN: CPU 100%'de uzun süre kalmamalı
```

### Test 5.2: Disk Space
```
1. 50 farklı ilan için afiş üret
2. uploads/posters/cache/ klasör boyutunu kontrol et
3. ✅ BEKLENEN: WebP ile ~10MB civarı olmalı
4. ⚠️ UYARI: >100MB ise cleanup gerekli
```

---

## 6️⃣ Admin Panel Testleri

### Test 6.1: Ayarlar Sayfası
```
1. WP Admin → HivePress → Afişler
2. "Generator Durumu" kısmını kontrol et
3. ✅ BEKLENEN: Tüm yeşil tikler görünmeli
```

### Test 6.2: Test Üretimi
```
1. Admin panelden bir ilan ID gir
2. Template ve size seç
3. "Afiş Üret" tıkla
4. ✅ BEKLENEN: Afiş preview gösterilmeli
```

### Test 6.3: Metabox
```
1. Bir ilan düzenleme sayfasına git
2. Sağ tarafta "İlan Afişi" metabox'ı bul
3. ✅ BEKLENEN: Afiş varsa gösterilmeli, yoksa "Afiş Üret" butonu
```

---

## 📊 Test Sonuç Tablosu

| Test | Durum | Notlar |
|------|-------|--------|
| 1.1 Cache Hit | ⬜ | |
| 1.2 Cache Invalidation | ⬜ | |
| 1.3 Template Cache | ⬜ | |
| 2.1 WebP Çalışıyor | ⬜ | |
| 2.2 Büyük Görsel | ⬜ | |
| 2.3 Memory Limit | ⬜ | |
| 3.1 Normal Kullanım | ⬜ | |
| 3.2 Rate Limit | ⬜ | |
| 3.3 Admin Whitelist | ⬜ | |
| 4.1 Generate API | ⬜ | |
| 4.2 Get API | ⬜ | |
| 4.3 Templates API | ⬜ | |
| 4.4 Status API | ⬜ | |

---

## ✅ Production Checklist

- [ ] Tüm testler geçti
- [ ] Font dosyası yüklendi (Inter-Bold.ttf)
- [ ] .htaccess cache dizininde var
- [ ] LiteSpeed Cache aktif
- [ ] Error log temiz
