# Manuel Adımlar — UmreBuldum Güvenlik & Sertleştirme

Bu dosya, yapılan otomatik değişikliklerin yanı sıra **elle yapılması gereken tüm adımları** kapsar.  
Her bölüm hangi oturumda yapıldığını belirtir.

---

## 1. Prisma Client'ı Yenile (KRİTİK — Her Schema Değişikliğinden Sonra)

Dev server türünü DLL olarak kilitliyor. Schema değiştiğinde şu sıraya uymak zorundasın:

```powershell
# 1. Dev server'ı durdur (Ctrl+C veya terminali kapat)

# 2. Prisma client'ı yeniden oluştur
npx prisma generate

# 3. Dev server'ı yeniden başlat
npm run dev
```

> **Ne zaman gerekli?**  
> Bu repo'da iki farklı oturumda schema değişti:
> - **Chat Hardening** → `Message.deletedAt`, `User.isMuted`, `User.mutedUntil`, `ChatMuteLog`
> - **Fintech Hardening** → `WebhookEvent`, `Transaction.refundedAt`, 3 yeni index
>
> Her ikisi de `prisma db push` ile uygulandı (exit 0 alındı), sadece `prisma generate` eksik kalabilir.

---

## 2. TypeScript Derleme Kontrolü

```powershell
npx tsc --noEmit 2>&1 | Select-Object -Last 40
```

> Çıkacak pre-existing hatalar (bu oturumlarda dokunulmayan dosyalar):
> - `lib/auth.ts` — `next-auth/jwt` augmentation uyarısı
> - `lib/api.ts` — `departureCity` nullable uyarısı
> - `app/tours/[slug]/page.tsx` — string | undefined ataması
> - `components/featured-tours.tsx` — posterImages tipi
>
> Bu dosyalardaki hataların **bu oturumla ilgisi yok** — mevcut pre-existing hatalardır.

---

## 3. Env Değişkenleri Kontrolü

`.env.local` dosyasında şunların tanımlı olduğunu doğrula:

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...           # veya sk_test_... geliştirme için
STRIPE_WEBHOOK_SECRET=whsec_...

# Cron güvenliği (production zorunlu)
CRON_SECRET=güçlü-rastgele-string

# Database
DATABASE_URL=mysql://...
```

---

## 4. Stripe Webhook Endpoint Kaydı

Stripe Dashboard → Developers → Webhooks → Add endpoint:

| Alan | Değer |
|------|-------|
| Endpoint URL | `https://senin-domainin.com/api/stripe/webhook` |
| Events | `checkout.session.completed`, `checkout.session.expired` |

Oluşturulan `Signing secret` değerini → `.env.local` içinde `STRIPE_WEBHOOK_SECRET` olarak ekle.

---

## 5. Reconcile Cron Job Kurulumu

Ödeme webhook'larını kaçıran veya yarıda kalan işlemleri düzeltmek için **15 dakikada bir** çalışması gerekir.

### Seçenek A — Vercel Cron (önerilen)

`vercel.json` dosyasını oluştur veya güncelle:

```json
{
  "crons": [
    {
      "path": "/api/cron/reconcile-payments",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Vercel, bu endpoint'i `Authorization: Bearer <CRON_SECRET>` header'ı ile çağırır.  
`CRON_SECRET` değişkenini Vercel dashboard'da Project Settings → Environment Variables'a ekle.

### Seçenek B — Harici Cron (cPanel, server, vs.)

```bash
*/15 * * * * curl -s -H "Authorization: Bearer CRON_SECRET" https://senin-domainin.com/api/cron/reconcile-payments
```

---

## 6. Rate Limit — Production'da Redis'e Geçiş

Şu an `lib/rate-limit.ts` ve `lib/chat-rate-limit.ts` in-memory Map kullanıyor.  
**Tek instance (Vercel serverless)** için bu yeterli. Birden fazla instance'ta (yatay ölçekleme) çalışmaz.

50.000+ kullanıcıya geçilirse:

```powershell
npm install ioredis
```

`lib/rate-limit.ts` içindeki `Map` → Redis `SET NX EX` ile değiştir.  
`chat-rate-limit.ts` içindeki daily count → `INCR + EXPIREAT UTC-midnight` ile değiştir.

> **Şimdilik aksiyon gerekmez** — mevcut implementasyon Vercel serverless'ta doğru çalışır.

---

## 7. Chat Mute — Admin Panel Entegrasyonu

`POST /api/admin/mute` ve `DELETE /api/admin/mute` endpoint'leri hazır.  
Admin arayüzüne bir "Mute" butonu eklemek için frontend tarafında manuel çalışma gerekir.

Request formatları:

```typescript
// Mute (geçici — 24 saat)
POST /api/admin/mute
{ "userId": "cuid", "mutedUntil": "2026-02-21T00:00:00Z", "reason": "Hakaret içerikli mesajlar" }

// Mute (kalıcı)
POST /api/admin/mute
{ "userId": "cuid", "reason": "Sistem kuralları ihlali" }

// Unmute
DELETE /api/admin/mute
{ "userId": "cuid", "reason": "Mute süresi doldu, uyarı yapıldı" }
```

---

## 8. Pagination — Frontend Entegrasyonu

`GET /api/chat/messages` artık cursor pagination destekliyor.  
Frontend chat bileşenini güncellemek gerekir:

```typescript
// İlk yükleme
const { messages, nextCursor } = await fetch('/api/chat/messages?threadId=xxx&limit=30').then(r => r.json());

// Daha fazla yükle (scroll yukarı)
const next = await fetch(`/api/chat/messages?threadId=xxx&limit=30&cursor=${nextCursor}`).then(r => r.json());
```

Mesajlar **en yeni önce** gelir (`orderBy: createdAt DESC`). Gösterimde `reverse()` uygula.

---

## 9. Soft Delete — Frontend Entegrasyonu

Kullanıcıların kendi mesajlarını silebilmesi için frontend'e "Sil" butonu ekle:

```typescript
DELETE /api/chat/messages
{ "messageId": "cuid" }
```

- Mesaj sahibi kendi mesajını silebilir
- Admin her mesajı silebilir
- Silinen mesajlar otomatik olarak listeden çıkar (`deletedAt != null` filter)

---

## 10. Admin Refund — Frontend Entegrasyonu

`PaymentService.refund()` artık atomik. Admin paneline refund butonu eklemek için:

```typescript
// lib/payment-service.ts içinde doğrudan çağır (server action veya API route üzerinden)
await PaymentService.refund(transactionId, adminId, "Kullanıcı talebi");
```

> Stripe refund + DB güncelleme + kredi geri alma hepsi tek atomik işlem.

---

## Özet — Hızlı Başlangıç

```powershell
# 1. Dev server'ı durdur
# 2. Schema + client'ı güncelle
npx prisma db push
npx prisma generate

# 3. TypeScript kontrol
npx tsc --noEmit 2>&1 | Select-Object -Last 30

# 4. Dev server'ı başlat
npm run dev
```

---

## 11. Kredi Sistemi — Race Condition Önlemleri ve Retry Mimarisi

Bu bölüm eşzamanlı isteklerden kaynaklanan yarış koşullarını ve bunlara karşı uygulanması gereken
kod kalıplarını açıklar. Aşağıdaki her bir madde **uygulamada zaten mevcut** veya **eklenmesi gereken** bir önlemi tanımlar.

---

### 11.1 Mevcut Koruma Katmanları (Değiştirme)

`lib/token-service.ts` içindeki `deductCredits()` şu anda üç katmanlı koruma kullanıyor:

| Katman | Mekanizma | Nerede |
|--------|-----------|--------|
| 1 | `SELECT … FOR UPDATE` — DB seviyesinde satır kilidi | Raw SQL, `$transaction` içinde |
| 2 | `SERIALIZABLE` isolation — ghost read yok | `{ isolationLevel: "Serializable" }` |
| 3 | `idempotencyKey @unique` — tekrar isteği no-op | `CreditTransaction.idempotencyKey` |

> **Bu üç katmanı asla kaldırma.** Özellikle `FOR UPDATE` olmadan iki paralel istek aynı
> bakiyeyi okuyup her ikisi de başarılı sayılabilir (TOCTOU hatası).

---

### 11.2 `SELECT FOR UPDATE` — Neden Raw SQL Gerekli

Prisma ORM'de `aggregate()` kilitleme desteği yok. Bakiye kontrolü için **mutlaka** raw SQL kullan:

```typescript
// ✅ Doğru — userId için tüm satırları kilitler
const [row] = await tx.$queryRaw<[{ balance: bigint }]>`
    SELECT COALESCE(SUM(amount), 0) AS balance
    FROM credit_transactions
    WHERE userId = ${userId}
    FOR UPDATE
`;

// ❌ Yanlış — kilitleme yok, stale read mümkün
const result = await tx.creditTransaction.aggregate({
    where: { userId },
    _sum: { amount: true }
});
```

---

### 11.3 Negatif Bakiye Koruması — Üç Savunma Hattı

```typescript
// Hatt 1: Kilit altında matematiksel kontrol (anında red)
if (balance < cost) throw new Error("INSUFFICIENT_CREDITS");

// Hat 2: Cache tabanı (uygulama katmanı güvenlik ağı)
if (updatedProfile.credits < 0) {
    await tx.guideProfile.update({ data: { credits: 0 } });
}

// Hat 3: DB kısıtlaması (isteğe bağlı, en güçlü güvence)
// Aşağıdaki komutu bir kez veritabanında çalıştır:
```

```sql
ALTER TABLE guide_profiles
ADD CONSTRAINT credits_non_negative CHECK (credits >= 0);
```

> Bu kısıtlamayı ekledikten sonra `prisma db pull` ile schema'yı senkronize et
> (Prisma, `CHECK` kısıtlamalarını `schema.prisma`'ya yansıtmaz ama DB'de aktif kalır).

---

### 11.4 Deadlock Önleme Kuralları

Aynı transaction içinde birden fazla tablo kilitleniyorsa kilit alma sırası sabit olmalı:

```
credit_transactions  →  guide_profiles
(her zaman bu sırayla)
```

Sıra tersine çevrilirse iki paralel transaction birbirini bekler → deadlock.

**Asla yapma:**
```typescript
// ❌ Stripe API'sini $transaction içinde çağırma — ağ gecikmesi boyunca kilit tutulur
await prisma.$transaction(async (tx) => {
    await tx.transaction.update(...);
    await stripe.refunds.create(...);  // ← kilit burada bekler
});
```

**Doğru:**
```typescript
// ✅ DB transaction bitsin, kilit bırakılsın, sonra Stripe API çağrılsın
await prisma.$transaction(async (tx) => {
    await tx.transaction.update(...);
    // paymentIntentId'yi buradan al
});
await stripe.refunds.create(...);  // transaction dışında
```

---

### 11.5 `withSerializableRetry` — Eklenmesi Gereken Yardımcı Fonksiyon

`SERIALIZABLE` transaction'lar MySQL tarafından iptal edilebilir (`ER_LOCK_DEADLOCK`, `ER_LOCK_WAIT_TIMEOUT`).
Bu durumda uygulamanın otomatik olarak yeniden denemesi gerekir.

**`lib/with-retry.ts` dosyasını oluştur:**

```typescript
/**
 * SERIALIZABLE transaction sonucunu döndürür.
 * MySQL deadlock veya lock timeout alınırsa üstel geri çekilme ile yeniden dener.
 *
 * Prisma hata kodu P2034 = serialization failure (deadlock dahil).
 */
export async function withSerializableRetry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3
): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const isRetryable =
                err.code === "P2034" ||                         // Prisma serialization failure
                err.message?.includes("deadlock") ||
                err.message?.includes("lock wait timeout");

            if (isRetryable && attempt < maxAttempts) {
                await new Promise(r => setTimeout(r, 100 * attempt)); // 100ms → 200ms
                continue;
            }
            throw err;
        }
    }
    throw new Error("Max retries exceeded");
}
```

**Kullanım — `token-service.ts` içinde:**

```typescript
// Mevcut:
const result = await prisma.$transaction(async (tx) => { ... }, { isolationLevel: "Serializable" });

// Güncellenmiş (retry ile):
const result = await withSerializableRetry(() =>
    TokenService.deductCredits(userId, cost, reason, relatedId, idempotencyKey)
);
```

---

### 11.6 Ledger (Defter) vs. Bakiye Tabanlı Tasarım

Mevcut sistem **hibrit** tasarım kullanıyor — bu doğru seçim:

| | Bakiye Tabanlı | Defter Tabanlı (mevcut) |
|--|--|--|
| Okuma | O(1) — tek alan | O(n) — SUM sorgusu |
| Denetim | Yok — geçmiş kaybolur | Tam — her işlem kayıtlı |
| Geri alma | Güç | `INSERT` ile negatif kayıt ekle |
| Tutarsızlık kurtarma | İmkânsız | `SUM(credit_transactions)` her zaman doğru |
| Race condition | `WHERE credits >= cost` ile kısmi koruma | `FOR UPDATE` + `SERIALIZABLE` tam koruma |

> **`GuideProfile.credits`** sadece hızlı okuma önbelleği.  
> **`CreditTransaction SUM`** her zaman gerçek bakiye.  
> Önbellek bozulursa: `TokenService.syncBalance(userId)` ile yeniden hesapla.

---

*Son güncelleme: 2026-02-20 — Role Audit, Chat Hardening, Fintech Hardening, Race Condition Analysis oturumları*
