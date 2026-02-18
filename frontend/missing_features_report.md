# Eksik Dosyalar ve Özellikler Raporu

Yapılan kod incelemesi sonucunda, "Mesajlaşma" ve "Afiş Üretimi" modülleri için aşağıdaki eksikler tespit edilmiştir.

## 1. Platform İçi Mesajlaşma (Sohbet)
Mevcut durumda temel metin tabanlı mesajlaşma altyapısı (Veritabanı modelleri, API uçları ve basit UI) mevcuttur, ancak modern bir sohbet deneyimi için kritik parçalar eksiktir.

### Eksik/Geliştirilmesi Gerekenler:
- **Gerçek Zamanlı İletişim (Real-time):** Şu anki yapı muhtemelen sayfa yenileme veya "polling" (belirli aralıklarla sorgu) mantığıyla çalışıyor. Anlık mesajlaşma için **WebSocket** veya **Pusher** entegrasyonu eksik.
- **Dosya Gönderimi:** Şemada `ChatMessage` modelinde sadece metin (`message`) alanı var. Resim veya dosya paylaşımı için bir alan (`attachmentUrl`) ve UI bileşeni yok.
- **Okundu Bilgisi:** Mesajların okunduğuna dair (`readAt`) mekanizma şemada ve lojikte yok.
- **Bildirimler:** Yeni mesaj geldiğinde e-posta veya site içi bildirim gönderen "Event Listener" yapısı eksik.

### Mevcut Dosyalar:
- `prisma/schema.prisma` (`ChatThread`, `ChatMessage` modelleri var)
- `app/api/chat/threads/route.ts`
- `app/api/chat/messages/route.ts`
- `app/dashboard/chats/page.tsx`
- `components/chat/chat-window.tsx` (İçeriği kontrol edilmeli)

---

## 2. Afiş Üretimi (Poster Generation)
Bu modül proje içerisinde **tamamen eksiktir**. Kod tabanında bu özelliğe dair herhangi bir dosya veya altyapı bulunmamaktadır.

### Eksik Dosyalar (Oluşturulması Gerekenler):
1.  **Afiş Tasarım Aracı (UI):**
    -   `app/dashboard/poster/page.tsx`: Rehberin ilan bilgilerini seçip şablon beğeneceği sayfa.
    -   `components/poster/PosterBuilder.tsx`: Sürükle-bırak veya şablon seçimi sunan bileşen.

2.  **Görsel Oluşturma Motoru (Backend/API):**
    -   `app/api/poster/generate/route.ts`: Seçilen şablonu ve ilan verilerini alıp resme (PNG/JPG) çeviren servis.
    -   **Teknoloji:** `satori` (Vercel OG Image motoru) veya `html2canvas` (Client-side) teknolojilerinin entegrasyonu gerekli.

3.  **Şablon Kütüphanesi:**
    -   Hazır tasarım şablonlarının kodlanması (Instagram hikaye boyutu, kare gönderi vb.).

### Özet Durum
| Özellik | Durum | Öncelikli Eksik |
| :--- | :--- | :--- |
| **Mesajlaşma** | 🟡 Kısmen Var | Real-time altyapı & Dosya paylaşımı |
| **Afiş Üretimi** | 🔴 Yok | Tüm dosyalar (UI, API, Lojik) |
