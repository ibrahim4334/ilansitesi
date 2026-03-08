import { test, expect } from '@playwright/test';

test.describe('Core E2E User Flows', () => {

    test('a) Anasayfanın sorunsuz açılması (200 OK)', async ({ request }) => {
        // HTTP isteği ile 200 kodu kontrolü ve HTML kontrolü
        const response = await request.get('/');
        expect(response.status()).toBe(200);

        const html = await response.text();
        expect(html).toContain('Umrebuldum');
    });

    test('b) pSEO Sayfasının doğru açılması (HTML & JSON-LD)', async ({ request }) => {
        // Önceden seed edilmiş bir pSEO slug'ı kullanıyoruz
        const slug = 'ankara-cikisli-15-gunluk-umre-turlari';

        // 200 Durum Kontrolü
        const response = await request.get(`/${slug}`);
        expect(response.status()).toBe(200);

        const html = await response.text();

        // H1/Title metinlerini kontrol et (büyük/küçük harf bağımsız)
        const lowerHtml = html.toLowerCase();
        expect(lowerHtml).toContain('ankara');
        expect(lowerHtml).toContain('15 günlük');
        expect(lowerHtml).toContain('umre');

        // JSON-LD varlığı kontrolü
        expect(html).toContain('application/ld+json');
    });

    test('c) Optimize Edilmiş Arama/Filtreleme API Yanıtı', async ({ request }) => {
        // N+1 sorunu çözülen aşama 2 rotamız
        const searchApiUrl = '/api/listings?departureCityOld=Ankara&durationText=15+Günlük';

        const response = await request.get(searchApiUrl);
        expect(response.status()).toBe(200); // Başarılı JSON dönüşü olmalı

        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();

        if (body.length > 0) {
            const firstListing = body[0];
            expect(firstListing).toHaveProperty('id');
            // isIdentityVerified dışındaki alanlar sızdırılmamalı
            if (firstListing.guide?.user) {
                expect(firstListing.guide.user.hashedPassword).toBeUndefined();
                expect(firstListing.guide.user.email).toBeUndefined();
            }
        }
    });
});
