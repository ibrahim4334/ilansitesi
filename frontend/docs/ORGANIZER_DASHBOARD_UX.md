# Organizer Dashboard - UX Specification

## Overview
A mobile-first dashboard for Umrah tour organizers to manage their listings, track performance, handle inquiries, and gain business insights.

---

## Information Architecture

```
📱 Organizer Dashboard
├── 🏠 Ana Sayfa (Overview)
│   ├── Performance Summary Cards
│   ├── Recent Requests (Talepler)
│   └── Quick Actions
├── 📋 İlanlarım (My Listings)
│   ├── Active Listings
│   ├── Draft/Pending
│   └── Expired
├── 📨 Talepler (Requests/Inquiries)
│   ├── Yeni (New)
│   ├── Beklemede (Pending)
│   └── Tamamlanan (Completed)
├── 📊 Performans (Analytics)
│   ├── Views Over Time
│   ├── Click-Through Rate
│   └── Conversion Funnel
├── 💰 Gelir (Revenue)
│   ├── Reservation Stats
│   ├── Commission Summary
│   └── Payout History
└── ⚙️ Ayarlar (Settings)
    ├── Profile
    ├── Notifications
    └── Subscription
```

---

## Screen Specifications

### 1. Overview Dashboard (Ana Sayfa)

**Purpose:** Quick snapshot of business health

**Layout:** Single column on mobile, 2-column grid on tablet+

#### Components:

**A. Greeting Header**
- "Merhaba, [Firma Adı] 👋"
- Current date
- Subscription badge (Free/Pro)

**B. KPI Summary Cards** (Horizontal scroll on mobile)
| Card | Icon | Value | Trend |
|------|------|-------|-------|
| Görüntülenme | 👁️ | 1,234 | +12% |
| Tıklama | 👆 | 456 | +8% |
| Talep | 📨 | 23 | +15% |
| Dönüşüm | 📈 | 5.1% | -2% |

**C. Recent Requests Preview**
- Last 3 requests as compact cards
- Name, tour interest, time ago
- Quick action: "Yanıtla" button
- "Tümünü Gör" link

**D. Quick Actions Grid**
- ➕ Yeni İlan Ekle
- 📢 Kampanya Oluştur
- 📊 Rapor İndir
- 🎨 Afiş Oluştur

---

### 2. My Listings (İlanlarım)

**Purpose:** Manage all listings

**Layout:** List view with status tabs

#### Tabs:
- Aktif (12)
- Taslak (3)
- Beklemede (1)
- Süresi Dolmuş (5)

#### Listing Card:
```
┌─────────────────────────────────────────┐
│ [Thumbnail]  Lüks Umre Turu - 15 Gün    │
│              ⭐ 4.8 (23 değerlendirme)  │
│              👁️ 1,234 görüntülenme      │
│                                         │
│ [Düzenle] [Afiş] [Gizle] [•••]         │
└─────────────────────────────────────────┘
```

#### Actions Menu (•••):
- Öne Çıkar
- Kopyala
- Sil
- Paylaş

---

### 3. Requests (Talepler)

**Purpose:** Manage customer inquiries

**Layout:** Inbox-style list

#### Request Card States:

**New (Unread):**
```
┌─────────────────────────────────────────┐
│ 🔵 Ahmet Yılmaz              2 saat önce│
│    Ekonomik Umre Paketi hakkında        │
│    "Merhaba, Nisan ayı için..."         │
│                         [Yanıtla] [📞]  │
└─────────────────────────────────────────┘
```

**Pending (Awaiting Response):**
```
┌─────────────────────────────────────────┐
│ 🟡 Fatma Demir               1 gün önce │
│    Ramazan Umresi hakkında              │
│    Son mesaj: "Fiyat bilgisi..."        │
│                         [Devam Et] [✓]  │
└─────────────────────────────────────────┘
```

#### Filters:
- Tümü | Okunmamış | Yanıt Bekliyor | Tamamlandı

---

### 4. Analytics (Performans)

**Purpose:** Detailed performance insights

#### Sections:

**A. Time Range Selector**
- Son 7 Gün | 30 Gün | 90 Gün | Özel

**B. Views Chart**
- Line chart showing daily views
- Comparison with previous period

**C. Traffic Sources**
- Doğrudan: 45%
- Arama: 35%
- Sosyal Medya: 15%
- Diğer: 5%

**D. Top Performing Listings**
| İlan | Görüntülenme | CTR |
|------|--------------|-----|
| Lüks Umre | 2,456 | 8.2% |
| Ekonomik | 1,823 | 6.1% |

**E. Conversion Funnel**
```
Görüntüleme (10,000) 
    ↓ 45%
Detay Sayfası (4,500)
    ↓ 12%
Talep Formu (540)
    ↓ 42%
Rezervasyon (227)
```

---

### 5. Revenue (Gelir)

**Purpose:** Financial overview

#### Cards:
- Bu Ay Gelir: ₺45,230
- Bekleyen Ödeme: ₺12,500
- Toplam Rezervasyon: 23

#### Commission Breakdown:
| Kaynak | Adet | Komisyon |
|--------|------|----------|
| Umrebuldum | 18 | ₺3,240 |
| Direkt | 5 | ₺0 |

#### Payout History:
- List of past payouts with status

---

## Design Tokens

```css
/* Colors */
--color-primary: #1e40af;      /* Blue 800 */
--color-primary-light: #3b82f6; /* Blue 500 */
--color-success: #10b981;       /* Emerald 500 */
--color-warning: #f59e0b;       /* Amber 500 */
--color-danger: #ef4444;        /* Red 500 */
--color-muted: #6b7280;         /* Gray 500 */

/* Spacing */
--space-xs: 0.25rem;  /* 4px */
--space-sm: 0.5rem;   /* 8px */
--space-md: 1rem;     /* 16px */
--space-lg: 1.5rem;   /* 24px */
--space-xl: 2rem;     /* 32px */

/* Border Radius */
--radius-sm: 0.375rem; /* 6px */
--radius-md: 0.5rem;   /* 8px */
--radius-lg: 0.75rem;  /* 12px */

/* Typography */
--font-size-xs: 0.75rem;   /* 12px */
--font-size-sm: 0.875rem;  /* 14px */
--font-size-base: 1rem;    /* 16px */
--font-size-lg: 1.125rem;  /* 18px */
--font-size-xl: 1.25rem;   /* 20px */
--font-size-2xl: 1.5rem;   /* 24px */
```

---

## Mobile-First Breakpoints

```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
```

---

## Interaction Patterns

### Gestures (Mobile)
- Swipe left on request card → Quick actions (Archive, Call)
- Pull to refresh on all lists
- Long press on listing → Context menu

### Loading States
- Skeleton loaders for cards
- Shimmer effect on data loading
- Optimistic updates for actions

### Empty States
- Friendly illustrations
- Clear call-to-action
- "Henüz talebiniz yok. İlanlarınızı öne çıkararak talep almaya başlayın!"

---

## Accessibility

- Minimum touch target: 44x44px
- Color contrast: WCAG AA
- Screen reader labels for icons
- Focus indicators for keyboard nav
