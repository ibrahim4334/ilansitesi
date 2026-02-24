import jsPDF from 'jspdf';

export const generatePDF = (listing: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 100); // Dark Blue
    doc.text(listing.title, 20, 20);

    // Guide Info
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Rehber: ${listing.guide?.fullName || 'Belirtilmemiş'}`, 20, 30);

    // Safely format date
    const dateStr = listing.startDate ? new Date(listing.startDate).toLocaleDateString('tr-TR') : 'Tarih Belirtilmemiş';
    doc.text(`Tarih: ${dateStr} - ${listing.totalDays || 0} Gün`, 20, 36);

    // Line
    doc.setDrawColor(200);
    doc.line(20, 42, pageWidth - 20, 42);

    // Content
    let y = 55;

    // Tour Plan
    if (listing.tourPlan && listing.tourPlan.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text("Tur Programı", 20, y);
        y += 10;

        listing.tourPlan.forEach((day: any) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            doc.setFontSize(14);
            doc.setTextColor(200, 100, 0); // Orange/Amber
            doc.text(`${day.day}. Gün - ${day.city}`, 20, y);
            y += 7;

            doc.setFontSize(11);
            doc.setTextColor(60);

            // Text wrap
            const splitText = doc.splitTextToSize(day.description, pageWidth - 40);
            doc.text(splitText, 20, y);

            y += (splitText.length * 5) + 8;
        });
    } else {
        doc.setFontSize(12);
        doc.text("Detaylı program bilgisi girilmemiştir.", 20, y);
        doc.text(listing.description || "", 20, y + 10, { maxWidth: pageWidth - 40 });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`UmreBuldum - ${listing.title}`, 20, 290);
        doc.text(`Sayfa ${i} / ${pageCount}`, pageWidth - 30, 290);
    }

    doc.save(`tur-programi-${listing.id}.pdf`);
};
