import React from 'react';
import { Phone, User, CheckCircle2, Star } from 'lucide-react';
import { PosterData } from '@/components/dashboard/poster-generator/PosterBuilder';
import { STOCK_BACKGROUNDS } from '@/components/dashboard/poster-generator/poster-assets';

export function Template3({ data, id, showWatermark = true }: { data: PosterData; id?: string, showWatermark?: boolean }) {
    const bgImage = STOCK_BACKGROUNDS.find(b => b.id === data.backgroundImage)?.url || STOCK_BACKGROUNDS[0].url;

    return (
        <div
            id={id}
            className="w-full h-full relative overflow-hidden bg-[#0f172a] flex flex-col font-sans template-container"
            style={{
                fontFamily: data.fontStyle === 'font-serif' ? 'Georgia, serif' : data.fontStyle === 'font-display' ? 'Impact, sans-serif' : 'System-ui, sans-serif'
            }}
        >
            {/* Very Subtle Background Image spanning whole poster */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{ backgroundImage: `url(${bgImage})`, filter: 'grayscale(50%)' }}
            />
            {/* Vignette */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#0f172a] mix-blend-multiply opacity-80" />

            {/* Inner Gold Thin Border Frame */}
            <div className="absolute inset-4 border border-[#cfb53b]/30 z-10 pointer-events-none rounded-2xl" />
            <div className="absolute inset-6 border border-[#cfb53b]/10 z-10 pointer-events-none rounded-xl" />

            {/* Content Container */}
            <div className="flex-1 flex flex-col z-20 p-12">

                {/* Header Phase */}
                <div className="text-center mb-10 flex flex-col items-center">
                    <Star className="w-8 h-8 text-[#cfb53b] mb-4" />
                    <div className="text-[#cfb53b] tracking-[0.4em] text-sm font-semibold uppercase mb-2">Özel Program</div>
                    <h1 className="text-5xl font-light text-white tracking-widest leading-tight uppercase relative inline-block">
                        {data.title}
                        {/* Decorative line under title */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-[#cfb53b]"></div>
                    </h1>
                </div>

                {/* 3 Column Data Phase */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="grid grid-cols-3 gap-8 w-full max-w-4xl mx-auto">
                        {[
                            { title: "4 KİŞİLİK", price: data.price4Person },
                            { title: "3 KİŞİLİK", price: data.price3Person },
                            { title: "2 KİŞİLİK", price: data.price2Person }
                        ].map((col, i) => (
                            <div key={i} className="flex flex-col items-center text-center group cursor-default">
                                {/* Price Box */}
                                <div className="w-full bg-white/5 backdrop-blur-sm border border-[#cfb53b]/30 rounded-t-full pt-10 pb-6 px-4 relative overflow-hidden transition-all duration-500 group-hover:bg-white/10 group-hover:border-[#cfb53b]/60">
                                    <div className="text-[#cfb53b] text-xs tracking-widest font-bold mb-3">{col.title} ODA</div>
                                    <div className="text-4xl font-light text-white mb-2">{col.price}</div>
                                </div>
                                {/* Features List under box */}
                                <div className="w-full pt-6 border-t border-[#cfb53b]/20">
                                    <div className="text-slate-300 text-sm space-y-3 font-light tracking-wide">
                                        <div><span className="text-[#cfb53b] text-xs mr-1">✦</span> {data.hotelMecca}</div>
                                        <div><span className="text-[#cfb53b] text-xs mr-1">✦</span> {data.hotelMedina}</div>
                                        <div className="opacity-70">Transfer & Vize</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Guide & Contact Footer Phase */}
                <div className="mt-12 pt-8 border-t border-[#cfb53b]/20 flex justify-between items-end backdrop-blur-md bg-[#0f172a]/40 p-6 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-2 border-[#cfb53b]/50 overflow-hidden flex items-center justify-center bg-[#cfb53b]/10">
                            <User className="w-8 h-8 text-[#cfb53b]" />
                        </div>
                        <div>
                            <div className="text-[#cfb53b] text-xs tracking-widest uppercase mb-1">Tur Rehberi</div>
                            <div className="text-2xl font-light text-white tracking-wide">{data.guideName}</div>
                            {data.isDiyanetPersonnel && (
                                <div className="text-emerald-400 text-[10px] uppercase tracking-widest mt-1 flex items-center gap-1 border border-emerald-400/30 w-max px-2 py-0.5 rounded-full bg-emerald-400/10">
                                    <CheckCircle2 className="w-3 h-3" /> Diyanet Görevlisi
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-slate-400 text-xs tracking-widest uppercase mb-2">İletişim</div>
                        <div className="flex items-center gap-3 text-3xl font-light text-white">
                            <Phone className="w-6 h-6 text-[#cfb53b]" />
                            {data.guidePhone}
                        </div>
                    </div>
                </div>
            </div>

            {showWatermark && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden opacity-10">
                    <div className="text-6xl font-light tracking-widest text-[#cfb53b] rotate-[-45deg] whitespace-nowrap">
                        UMREBULDUM.COM
                    </div>
                </div>
            )}
        </div>
    );
}
