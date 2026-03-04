'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2, Lock, Star } from 'lucide-react';
import html2canvas from 'html2canvas';

// Templates
import { POSTER_TEMPLATES } from '@/components/dashboard/poster-templates/registry';
import { Template1 } from '@/components/dashboard/poster-templates/Template1';
import { Template2 } from '@/components/dashboard/poster-templates/Template2';
import { Template3 } from '@/components/dashboard/poster-templates/Template3';
import { Template4 } from '@/components/dashboard/poster-templates/Template4';
import { Template5 } from '@/components/dashboard/poster-templates/Template5';
import { Template6 } from '@/components/dashboard/poster-templates/Template6';
import { Template7 } from '@/components/dashboard/poster-templates/Template7';
import { Template8 } from '@/components/dashboard/poster-templates/Template8';
import { Template9 } from '@/components/dashboard/poster-templates/Template9';
import { Template10 } from '@/components/dashboard/poster-templates/Template10';
import { PackageLimits } from '@/lib/package-system';
import { TierType } from '@/lib/tier-config';
import { STOCK_BACKGROUNDS, FRAME_STYLES, FONT_STYLES } from '@/components/dashboard/poster-generator/poster-assets';

// Map registry IDs to actual react components
const TEMPLATE_COMPONENTS: Record<string, React.FC<any>> = {
    'tpl-01-classic': Template1,
    'tpl-02-modern': Template2,
    'tpl-03-elegant': Template3,
    'tpl-04-premium': Template4,
    'tpl-05-luxury': Template5,
    'tpl-06-emerald': Template6,
    'tpl-07-rose': Template7,
    'tpl-08-indigo': Template8,
    'tpl-09-vibrant': Template9,
    'tpl-10-darkmatic': Template10,
};

// Map package ranks to determine access
const PACKAGE_RANK: Record<string, number> = {
    "FREE": 0,
    "STARTER": 1,
    "PRO": 2,
    "LEGEND": 3,
    "CORP_BASIC": 10,
    "CORP_PRO": 11,
    "CORP_ENTERPRISE": 12,
};

export interface PosterData {
    title: string;
    price2Person: string;
    price3Person: string;
    price4Person: string;
    date: string;
    guideName: string;
    guidePhone: string;
    isDiyanetPersonnel: boolean;
    backgroundImage: string;
    frameStyle: string;
    fontStyle: string;
    hotelMecca: string;
    hotelMedina: string;
}

interface PosterBuilderProps {
    packageType: string;
    limits: PackageLimits;
    initialData?: Partial<PosterData>;
}

export function PosterBuilder({ packageType, limits, initialData }: PosterBuilderProps) {
    const previewRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState(POSTER_TEMPLATES[0].id);

    // Initial State Setup
    const [data, setData] = useState<PosterData>({
        title: initialData?.title || "UMREYE GİDİYORUZ",
        price4Person: "$1199",
        price3Person: "$1550",
        price2Person: "$1850",
        date: initialData?.date || new Date().toLocaleDateString('tr-TR'),
        guideName: initialData?.guideName || "Abdullah Ademoğlu",
        guidePhone: initialData?.guidePhone || "+123-456-7890",
        isDiyanetPersonnel: false,
        backgroundImage: "bg-kabe-1",
        frameStyle: "frame-classic",
        fontStyle: "font-sans",
        hotelMecca: "Mekke Otel",
        hotelMedina: "Medine Otel"
    });

    // Permission Checking Logic
    const userRank = PACKAGE_RANK[packageType] ?? 0;

    const isTemplateLocked = (requiredTier: string) => {
        const requiredRank = PACKAGE_RANK[requiredTier] ?? 0;
        // Corporate packages generally unlock all guide features up to LEGEND.
        // We make a simple check: if userRank >= requiredRank it's unlocked.
        return userRank < requiredRank;
    };

    const handleDownload = async () => {
        if (!previewRef.current) return;
        setGenerating(true);

        // Quality Configuration based on package limits
        let scale = 1;
        if (limits.posterQuality === "NORMAL") scale = 2;
        if (limits.posterQuality === "HIGH") scale = 3;

        try {
            // Wait for any fonts/images to load (basic delay)
            await new Promise(r => setTimeout(r, 300));

            const canvas = await html2canvas(previewRef.current, {
                scale,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null, // Transparent background if rounded corners
                logging: false,
            });

            const link = document.createElement('a');
            link.download = `umre-afis-${selectedTemplateId}-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Canvas export failed", err);
            alert("Afiş oluşturulurken bir hata oluştu. Lütfen farklı bir görsel ile deneyin.");
        } finally {
            setGenerating(false);
        }
    };

    const SelectedTemplateComponent = TEMPLATE_COMPONENTS[selectedTemplateId];

    return (
        <div className="flex flex-col lg:flex-row h-[85vh] border rounded-2xl overflow-hidden shadow-xl bg-white">

            {/* Left Sidebar: Settings & Inputs */}
            <div className="w-full lg:w-[400px] border-r flex flex-col h-full bg-slate-50 flex-shrink-0">
                <div className="p-6 border-b bg-white">
                    <h2 className="text-xl font-bold text-slate-900">Afiş Oluşturucu</h2>
                    <p className="text-sm text-slate-500 mt-1">Paketinize uygun şablonu seçip afişinizi anında indirin.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Template Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-bold text-slate-700">Şablon Seçimi</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {POSTER_TEMPLATES.map((tpl) => {
                                const locked = isTemplateLocked(tpl.requiredTier);
                                const active = selectedTemplateId === tpl.id;

                                return (
                                    <button
                                        key={tpl.id}
                                        onClick={() => !locked && setSelectedTemplateId(tpl.id)}
                                        className={`relative group rounded-xl border-2 overflow-hidden aspect-[4/5] transition-all text-left flex flex-col ${active ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-slate-300'
                                            } ${locked ? 'opacity-60 cursor-not-allowed grayscale-[0.5]' : 'cursor-pointer'}`}
                                    >
                                        <div className="flex-1 bg-slate-100 flex items-center justify-center p-2 relative">
                                            <div className="text-xs text-slate-400 font-mono absolute top-2 left-2">{tpl.id.split('-')[1]}</div>
                                            {/* Placeholder instead of real thumbnail for now */}
                                            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 rounded shadow-sm"></div>
                                        </div>
                                        <div className="p-2 bg-white">
                                            <div className="text-xs font-semibold truncate pr-4">{tpl.name}</div>
                                            {locked && (
                                                <div className="absolute bottom-2 right-2 text-red-500" title={`Requires ${tpl.requiredTier}`}>
                                                    <Lock className="w-3 h-3" />
                                                </div>
                                            )}
                                            {active && !locked && (
                                                <div className="absolute bottom-2 right-2 text-primary">
                                                    <Star className="w-3 h-3 fill-current" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <hr className="border-slate-200" />

                    {/* Form Inputs */}
                    <div className="space-y-4">
                        <Label className="text-sm font-bold text-slate-700">İçerik Düzenleme</Label>
                        <div className="space-y-3">
                            {/* NEW SELECTION INPUTS */}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">Arka Plan</Label>
                                    <select
                                        className="w-full text-sm border rounded p-2"
                                        value={data.backgroundImage}
                                        onChange={e => setData({ ...data, backgroundImage: e.target.value })}
                                    >
                                        {STOCK_BACKGROUNDS.map(bg => <option key={bg.id} value={bg.id}>{bg.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">Çerçeve Stili</Label>
                                    <select
                                        className="w-full text-sm border rounded p-2"
                                        value={data.frameStyle}
                                        onChange={e => setData({ ...data, frameStyle: e.target.value })}
                                    >
                                        {FRAME_STYLES.map(fs => <option key={fs.id} value={fs.id}>{fs.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1 mt-2 mb-4">
                                <Label className="text-xs text-slate-500">Yazı Tipi</Label>
                                <select
                                    className="w-full text-sm border rounded p-2"
                                    value={data.fontStyle}
                                    onChange={e => setData({ ...data, fontStyle: e.target.value })}
                                >
                                    {FONT_STYLES.map(fs => <option key={fs.id} value={fs.id}>{fs.label}</option>)}
                                </select>
                            </div>

                            <hr className="my-2" />

                            <div>
                                <Label className="text-xs text-slate-500 font-bold">Tur Detayları</Label>
                                <Input className="mt-1" placeholder="Tur Başlığı" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <div>
                                    <Label className="text-xs text-slate-500">4 Kişilik Oda</Label>
                                    <Input value={data.price4Person} onChange={e => setData({ ...data, price4Person: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">3 Kişilik Oda</Label>
                                    <Input value={data.price3Person} onChange={e => setData({ ...data, price3Person: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">2 Kişilik Oda</Label>
                                    <Input value={data.price2Person} onChange={e => setData({ ...data, price2Person: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div>
                                    <Label className="text-xs text-slate-500">Mekke Otel</Label>
                                    <Input value={data.hotelMecca} onChange={e => setData({ ...data, hotelMecca: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Medine Otel</Label>
                                    <Input value={data.hotelMedina} onChange={e => setData({ ...data, hotelMedina: e.target.value })} />
                                </div>
                            </div>

                            <hr className="my-2" />

                            <div>
                                <Label className="text-xs text-slate-500 font-bold">Rehber ve İletişim</Label>
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <Input placeholder="Ad Soyad" value={data.guideName} onChange={e => setData({ ...data, guideName: e.target.value })} />
                                    <Input placeholder="Telefon" value={data.guidePhone} onChange={e => setData({ ...data, guidePhone: e.target.value })} />
                                </div>
                                <div className="flex items-center gap-2 mt-3 p-3 bg-slate-50 rounded-lg border">
                                    <input
                                        type="checkbox"
                                        id="diyanetToggle"
                                        className="w-4 h-4 cursor-pointer"
                                        checked={data.isDiyanetPersonnel}
                                        onChange={e => setData({ ...data, isDiyanetPersonnel: e.target.checked })}
                                    />
                                    <Label htmlFor="diyanetToggle" className="text-sm cursor-pointer select-none">Tecrübeli Diyanet Personeli Rozeti Ekle</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-white">
                    <Button
                        onClick={handleDownload}
                        disabled={generating}
                        className="w-full h-12 text-md shadow-lg"
                        size="lg"
                    >
                        {generating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                        Afişi İndir ({limits.posterQuality} Kalite)
                    </Button>
                    {limits.watermark && (
                        <div className="text-center text-xs text-amber-600 mt-2 font-medium">
                            Ücretsiz paketlerde filigran eklenir. Premium paketlere geçerek filigranı kaldırabilirsiniz.
                        </div>
                    )}
                </div>
            </div>

            {/* Right Area: Preview Engine */}
            <div className="flex-1 bg-slate-900 border-l border-slate-800 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur text-slate-300 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border border-slate-700 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Canlı Önizleme (Scale: To Fit)
                </div>

                <div className="w-full h-full flex items-center justify-center">
                    {/* CSS scaling container for the giant 1080x1350 canvas */}
                    <div className="transform origin-center transition-all duration-300"
                        style={{
                            transform: 'scale(0.4)', // Approx scale for a typical laptop screen to fit 1350px height
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                        }}>

                        {/* The actual Render Container used by html2canvas */}
                        <div ref={previewRef} className="relative bg-white" style={{ width: 1080, height: 1350 }}>
                            {SelectedTemplateComponent && (
                                <SelectedTemplateComponent
                                    data={data}
                                    id="poster-template-root"
                                    showWatermark={limits.watermark}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
