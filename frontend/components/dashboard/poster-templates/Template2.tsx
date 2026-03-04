import React from 'react';
import { Phone, User, CheckCircle2, MapPin } from 'lucide-react';
import { PosterData } from '@/components/dashboard/poster-generator/PosterBuilder';
import { STOCK_BACKGROUNDS } from '@/components/dashboard/poster-generator/poster-assets';

export function Template2({ data, id, showWatermark = true }: { data: PosterData; id?: string, showWatermark?: boolean }) {
    const bgImage = STOCK_BACKGROUNDS.find(b => b.id === data.backgroundImage)?.url || STOCK_BACKGROUNDS[0].url;

    return (
        <div
            id={id}
            className="w-full h-full relative overflow-hidden bg-[#f0f9ff] flex flex-col font-sans template-container"
            style={{
                fontFamily: data.fontStyle === 'font-serif' ? 'Georgia, serif' : data.fontStyle === 'font-display' ? 'Impact, sans-serif' : 'Inter, sans-serif'
            }}
        >
            {/* Top Header / Image Container */}
            <div className="h-[45%] w-full relative rounded-b-[60px] overflow-hidden shadow-2xl z-10">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${bgImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0284c7]/80 to-transparent" />

                <div className="absolute top-10 left-10 right-10 flex justify-between items-start text-white">
                    <div>
                        <div className="text-xl tracking-[0.2em] font-medium opacity-90 mb-1">KUTSAL YOLCULUK</div>
                        <h1 className="text-6xl font-black tracking-tight leading-none drop-shadow-lg">
                            {data.title}
                        </h1>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30 text-right">
                        <div className="text-sm font-semibold opacity-90 uppercase">Başlayan Fiyatlarla</div>
                        <div className="text-4xl font-black">{data.price4Person}</div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-12 pt-16 flex flex-col z-0">

                {/* 3 Column Pricing (Modern Cards) */}
                <div className="grid grid-cols-3 gap-6 mb-8 mt-[-100px] z-20 relative">
                    {[
                        { title: "4 KİŞİLİK ODA", price: data.price4Person },
                        { title: "3 KİŞİLİK ODA", price: data.price3Person },
                        { title: "2 KİŞİLİK ODA", price: data.price2Person }
                    ].map((col, i) => (
                        <div key={i} className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(2,132,199,0.15)] flex flex-col items-center border border-[#e0f2fe]">
                            <div className="text-sm text-[#0284c7] font-bold tracking-widest mb-2">{col.title}</div>
                            <div className="text-4xl font-black text-slate-800 mb-4">{col.price}</div>
                            <div className="w-full h-px bg-slate-100 mb-4"></div>

                            <div className="w-full space-y-3 text-sm font-medium text-slate-600">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#38bdf8]" /> Mekke: {data.hotelMecca}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#38bdf8]" /> Medine: {data.hotelMedina}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Vize & Uçak Bileti
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex-1 flex flex-col justify-end pb-12">
                    <div className="flex items-end justify-between bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 relative">
                        {/* Decorative background shape */}
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-[#0284c7] rounded-r-[40px] opacity-10"></div>

                        <div>
                            <div className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-1">Rehber İletişim</div>
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-full bg-[#0284c7]/10 flex items-center justify-center text-[#0284c7]">
                                    <User className="w-7 h-7" />
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-slate-800">{data.guideName}</div>
                                    {data.isDiyanetPersonnel && (
                                        <div className="text-emerald-600 text-xs font-bold tracking-wide mt-0.5 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> DİYANET PERSONELİ
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-[#0284c7] flex items-center justify-center text-white shadow-lg shadow-sky-500/30 transform rotate-3">
                                <Phone className="w-8 h-8 -rotate-3" />
                            </div>
                            <div className="text-4xl font-black text-[#0284c7] tracking-tight">
                                {data.guidePhone}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="h-16 bg-[#0284c7] flex items-center justify-center text-white font-bold tracking-[0.3em] text-sm">
                WWW.UMREBULDUM.COM
            </div>

            {showWatermark && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden opacity-20">
                    <div className="text-7xl font-black text-slate-400 rotate-[-30deg] whitespace-nowrap mix-blend-multiply">
                        UMREBULDUM UMREBULDUM
                    </div>
                </div>
            )}
        </div>
    );
}
