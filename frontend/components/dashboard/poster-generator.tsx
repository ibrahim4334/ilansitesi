'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PosterTemplate } from './poster-template';
import { Download, Loader2, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';

interface PosterGeneratorProps {
    listing: any;
}

export function PosterGenerator({ listing }: PosterGeneratorProps) {
    const [open, setOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    // Safely parse date
    const formatDate = (dateString: string) => {
        try {
            if (!dateString) return new Date().toLocaleDateString('tr-TR');
            return new Date(dateString).toLocaleDateString('tr-TR');
        } catch (e) {
            return new Date().toLocaleDateString('tr-TR');
        }
    };

    const [data, setData] = useState({
        title: listing.title || "Umre Turu",
        price: listing.pricing?.currency ? `${listing.price} ${listing.pricing.currency}` : `${listing.price || 0} SAR`,
        date: formatDate(listing.startDate),
        guideName: listing.guide?.fullName || "Rehber Adı",
        guidePhone: listing.guide?.phone || "+90 555 000 0000",
        image: listing.posterImages?.[0] || listing.image,
        features: listing.extraServices || [],
        hotel: listing.hotelName || "Otelsiz"
    });

    const handleDownload = async () => {
        if (!previewRef.current) return;
        setGenerating(true);

        try {
            const canvas = await html2canvas(previewRef.current, {
                scale: 2, // High quality
                useCORS: true, // For cross-origin images
                allowTaint: true
            });

            const link = document.createElement('a');
            link.download = `afis-${(listing.title || 'tur').slice(0, 20)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error(err);
            alert("Afiş oluşturulurken bir hata oluştu.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Afiş Oluştur
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b flex-shrink-0">
                    <DialogTitle>Afiş Oluşturucu</DialogTitle>
                    <DialogDescription>
                        Afiş üzerindeki bilgileri düzenleyebilir ve PNG olarak indirebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Controls */}
                    <div className="w-full lg:w-80 p-6 border-r overflow-y-auto bg-gray-50 flex-shrink-0 space-y-4">
                        <div className="space-y-2">
                            <Label>Başlık</Label>
                            <Input value={data.title} onChange={e => setData({ ...data, title: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Fiyat</Label>
                            <Input value={data.price} onChange={e => setData({ ...data, price: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Tarih</Label>
                            <Input value={data.date} onChange={e => setData({ ...data, date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Rehber Adı</Label>
                            <Input value={data.guideName} onChange={e => setData({ ...data, guideName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Telefon</Label>
                            <Input value={data.guidePhone} onChange={e => setData({ ...data, guidePhone: e.target.value })} />
                        </div>
                        <div className="pt-4">
                            <Button onClick={handleDownload} disabled={generating} className="w-full">
                                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                PNG İndir
                            </Button>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 bg-gray-200 overflow-hidden flex items-center justify-center p-2 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="origin-center transform scale-[0.35] sm:scale-[0.4] md:scale-[0.45] lg:scale-[0.5] xl:scale-[0.55] 2xl:scale-[0.6] transition-transform duration-300 shadow-2xl">
                                <div ref={previewRef} id="poster-root" style={{ width: '1080px', height: '1350px', backgroundColor: 'white' }}>
                                    <style dangerouslySetInnerHTML={{
                                        __html: `
                                        #poster-root * {
                                            border-color: #e5e7eb !important;
                                            outline-color: transparent !important;
                                        }
                                    `}} />
                                    <PosterTemplate data={data} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
