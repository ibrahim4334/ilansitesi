
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/api-guards";

// Simple HTML Template for PDF Print
const generateHTML = (listing: any, guide: any) => `
<!DOCTYPE html>
<html>
<head>
 <title>${listing.title} - Tur Detayları</title>
 <style>
   body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
   .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eab308; padding-bottom: 20px; margin-bottom: 30px; }
   .brand { font-size: 24px; font-weight: bold; color: #1e3a8a; }
   .guide-info { text-align: right; }
   .title { font-size: 28px; font-weight: bold; margin-bottom: 15px; color: #111; }
   .meta { display: flex; gap: 20px; margin-bottom: 30px; font-size: 14px; color: #666; }
   .price-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
   .price-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 15px; }
   .price-val { font-weight: bold; color: #0f172a; }
   h2 { font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-top: 30px; }
   .timeline { margin-top: 20px; }
   .day { display: flex; gap: 15px; margin-bottom: 15px; }
   .day-num { font-weight: bold; min-width: 60px; color: #eab308; }
   .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
   .trust-badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
 </style>
</head>
<body>
  <div class="header">
    <div class="brand">Umre Buldum</div>
    <div class="guide-info">
      <div style="font-weight:bold">${guide.fullName || "Rehber"}</div>
      <div>${guide.package === 'FREEMIUM' ? 'İletişim Gizli' : (guide.phone || '')}</div>
      ${guide.trustScore ? `<div class="trust-badge">Güven Puanı: ${guide.trustScore}</div>` : ''}
    </div>
  </div>

  <div class="title">${listing.title}</div>
  
  <div class="meta">
    <div>🛫 ${listing.departureCity} kalkışlı</div>
    <div>📅 ${listing.totalDays || 10} Gün</div>
    <div>🏨 ${listing.hotelName || "Belirtilmemiş"}</div>
    <div>✈️ ${listing.airline || "THY"}</div>
  </div>

  <div class="price-box">
    <div class="price-row">
      <span>4 Kişilik Oda</span>
      <span class="price-val">${listing.pricingQuad || '-'} SAR</span>
    </div>
    <div class="price-row">
      <span>3 Kişilik Oda</span>
      <span class="price-val">${listing.pricingTriple || '-'} SAR</span>
    </div>
    <div class="price-row">
      <span>2 Kişilik Oda</span>
      <span class="price-val">${listing.pricingDouble || '-'} SAR</span>
    </div>
  </div>

  <h2>Tur Programı</h2>
  <div class="timeline">
    ${listing.tourDays && listing.tourDays.length > 0 ?
    listing.tourDays.map((d: any) => `
        <div class="day">
          <div class="day-num">${d.day}. Gün</div>
          <div>
            <div style="font-weight:bold; margin-bottom:4px;">${d.city}</div>
            <div>${d.description}</div>
          </div>
        </div>
      `).join('')
    : '<p>Detaylı program girilmemiştir.</p>'
  }
  </div>

  <h2>Hizmetler</h2>
  <ul>
    ${(listing.extraServices as string[])?.map((s: string) => `<li>${s}</li>`).join('') || '<li>Standart Hizmetler</li>'}
  </ul>

  <div class="footer">
    Bu belge ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur. <br/>
    Detaylar ve rezervasyon için platformu ziyaret edin.
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
`;

export async function GET(req: Request) {
  try {
    const session = await auth();
    const guard = requireAuth(session);
    if (guard) return guard;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const listing = await prisma.guideListing.findUnique({
      where: { id },
      include: {
        guide: true,
        tourDays: { orderBy: { day: 'asc' } }
      }
    });

    if (!listing) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const guide = listing.guide;

    if (!guide || (guide.package === 'FREEMIUM' && !listing.isFeatured)) {
      return new NextResponse("Bu özellik sadece Premium rehber ilanlarında aktiftir.", { status: 403 });
    }

    const html = generateHTML({ ...listing, tourDays: listing.tourDays }, guide);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
