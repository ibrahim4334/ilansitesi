import React from 'react';
import { Calendar, Phone, User, CheckCircle2, Navigation } from 'lucide-react';
import { PosterData } from '@/components/dashboard/poster-generator/PosterBuilder';
import { STOCK_BACKGROUNDS } from '@/components/dashboard/poster-generator/poster-assets';

export function Template6({ data, id, showWatermark = true }: { data: PosterData; id?: string, showWatermark?: boolean }) {
    const bgImage = STOCK_BACKGROUNDS.find(b => b.id === data.backgroundImage)?.url || STOCK_BACKGROUNDS[0].url;

    return (
        <div
            id={id}
            className="w-full h-full relative overflow-hidden bg-emerald-950 flex flex-col font-sans template-container"
            style={{
                fontFamily: data.fontStyle === 'font-serif' ? 'Georgia, serif' : data.fontStyle === 'font-display' ? 'Impact, sans-serif' : 'Arial, sans-serif',
            }}
        >
            {/* Split screen: Top Left Text, Bottom Right Image */}
            <div className="absolute inset-x-0 bottom-0 h-[60%] w-full flex justify-end">
                <div
                    className="w-[85%] h-full rounded-tl-[120px] bg-cover bg-center shadow-2xl overflow-hidden relative"
                    style={{ backgroundImage: `url(${bgImage})` }}
                >
                    <div className="absolute inset-0 bg-emerald-950/40 mix-blend-multiply" />
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col z-10 p-16">

                {/* Header Phase */}
                <div className="max-w-xl">
                    <div className="w-20 h-2 bg-emerald-500 mb-8 rounded-full" />
                    <div className="text-emerald-400 tracking-[0.4em] text-sm font-bold uppercase mb-4">Güzide Yolculuk</div>
                    <h1 className="text-7xl font-bold text-white tracking-tight leading-tight mb-8">
                        {data.title}
                    </h1>

                    <div className="flex items-center gap-4 text-2xl font-medium text-emerald-100 mb-12 bg-white/5 w-max px-6 py-4 rounded-3xl backdrop-blur-sm border border-white/10">
                        <Calendar className="w-8 h-8 text-emerald-500" />
                        {data.date}
                    </div>
                </div>

                {/* 3 Column Data Phase - Vertical Left side */}
                <div className="flex-1 flex flex-col justify-center space-y-6 max-w-sm mb-12">
                    {[
                        { title: "4 KİŞİLİK ODA", price: data.price4Person },
                        { title: "3 KİŞİLİK ODA", price: data.price3Person },
                        { title: "2 KİŞİLİK ODA", price: data.price2Person }
                    ].map((col, i) => (
                        <div key={i} className="flex items-center gap-6 bg-emerald-900/50 backdrop-blur-md border border-emerald-500/20 p-5 rounded-3xl">
                            <div className="w-16 h-16 rounded-full bg-emerald-800 flex flex-col justify-center items-center text-emerald-300 font-bold border border-emerald-500/30">
                                <span className="text-2xl">{col.title.charAt(0)}</span>
                                <span className="text-[10px] uppercase">Kişi</span>
                            </div>
                            <div>
                                <div className="text-emerald-100 text-xs tracking-widest uppercase mb-1">{col.title} Kişi Başı</div>
                                <div className="text-3xl font-bold text-white">{col.price}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info and Guide Footer */}
                <div className="mt-auto bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[40px] flex justify-between items-center w-[95%] shadow-2xl">
                    <div className="space-y-4 text-emerald-50 w-1/3 border-r border-white/10 pr-6">
                        <div className="flex items-center gap-3">
                            <Navigation className="w-5 h-5 text-emerald-400" />
                            <span>Mekke: <b className="font-bold">{data.hotelMecca}</b></span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Navigation className="w-5 h-5 text-emerald-400" />
                            <span>Medine: <b className="font-bold">{data.hotelMedina}</b></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-1/3 px-6">
                        <div className="w-16 h-16 rounded-full bg-emerald-800 border-2 border-emerald-500 flex items-center justify-center overflow-hidden">
                            <User className="w-8 h-8 text-emerald-300" />
                        </div>
                        <div>
                            <div className="text-emerald-300 text-[10px] tracking-widest uppercase font-bold mb-1">Rehberimiz</div>
                            <div className="text-2xl font-bold text-white leading-none mb-1">{data.guideName}</div>
                            {data.isDiyanetPersonnel && (
                                <div className="text-emerald-400 text-[10px] uppercase tracking-widest flex items-center gap-1 font-bold">
                                    <CheckCircle2 className="w-3 h-3" /> Diyanet Personeli
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end w-1/3">
                        <div className="flex flex-col items-end">
                            <div className="text-emerald-300 text-[10px] tracking-widest uppercase font-bold mb-1">İletişim Hattı</div>
                            <div className="flex items-center gap-3 text-3xl font-bold text-white bg-emerald-500 px-6 py-3 rounded-full shadow-lg shadow-emerald-500/30">
                                <Phone className="w-6 h-6" />
                                {data.guidePhone}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showWatermark && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden opacity-5">
                    <div className="text-[120px] font-black text-white/50 -rotate-12 whitespace-nowrap">
                        UMREBULDUM
                    </div>
                </div>
            )}
        </div>
    );
}
