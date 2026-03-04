import React from 'react';
import { Phone, User, CheckCircle2, Navigation } from 'lucide-react';
import { PosterData } from '@/components/dashboard/poster-generator/PosterBuilder';
import { STOCK_BACKGROUNDS } from '@/components/dashboard/poster-generator/poster-assets';

export function Template4({ data, id, showWatermark = true }: { data: PosterData; id?: string, showWatermark?: boolean }) {
    const bgImage = STOCK_BACKGROUNDS.find(b => b.id === data.backgroundImage)?.url || STOCK_BACKGROUNDS[0].url;

    return (
        <div
            id={id}
            className="w-full h-full relative overflow-hidden bg-slate-50 flex flex-col font-sans template-container"
            style={{
                fontFamily: data.fontStyle === 'font-serif' ? 'Georgia, serif' : data.fontStyle === 'font-display' ? 'Impact, sans-serif' : 'Arial, sans-serif'
            }}
        >
            {/* Split Header Layout - Top 40% Image */}
            <div className="h-[40%] w-full relative">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${bgImage})` }}
                />

                {/* Emerald Overlay */}
                <div className="absolute inset-0 bg-emerald-900/60 mix-blend-multiply" />

                {/* Content over image */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                    <div className="w-16 h-1 bg-emerald-400 mb-6" />
                    <h1 className="text-6xl font-black text-white tracking-widest uppercase mb-4 drop-shadow-xl">
                        {data.title}
                    </h1>
                    <div className="text-emerald-100/80 tracking-[0.2em] uppercase text-sm font-bold">Premium Umre Organizasyonu</div>
                </div>

                {/* Diagonal Cut */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-50" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}></div>
            </div>

            {/* Body */}
            <div className="flex-1 px-16 pt-8 pb-12 flex flex-col relative z-10">

                {/* 3 Pricing Cards Container */}
                <div className="grid grid-cols-3 gap-8 mb-10 w-full">
                    {[
                        { title: "4 KİŞİLİK ODA", price: data.price4Person, isMain: false },
                        { title: "3 KİŞİLİK ODA", price: data.price3Person, isMain: true },
                        { title: "2 KİŞİLİK ODA", price: data.price2Person, isMain: false }
                    ].map((col, i) => (
                        <div key={i} className={`flex flex-col rounded-3xl overflow-hidden transition-all ${col.isMain ? 'bg-slate-900 text-white shadow-2xl scale-105 transform z-20 border border-slate-700' : 'bg-white text-slate-800 shadow-xl border border-slate-200'}`}>
                            <div className={`py-4 text-center text-xs font-bold tracking-widest ${col.isMain ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {col.title}
                            </div>
                            <div className="flex-1 p-8 flex flex-col items-center text-center">
                                <div className="text-sm font-semibold opacity-60 mb-1">Kişi Başı</div>
                                <div className={`text-4xl font-black ${col.isMain ? 'text-emerald-400' : 'text-slate-900'} mb-6`}>{col.price}</div>

                                <div className={`w-full h-px ${col.isMain ? 'bg-slate-700' : 'bg-slate-200'} mb-6`} />

                                <div className="space-y-4 text-sm font-medium w-full text-left">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-full ${col.isMain ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                            <Navigation className="w-3 h-3" />
                                        </div>
                                        {data.hotelMecca}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-full ${col.isMain ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                            <Navigation className="w-3 h-3" />
                                        </div>
                                        {data.hotelMedina}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-full ${col.isMain ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                            <CheckCircle2 className="w-3 h-3" />
                                        </div>
                                        Ulaşım ve Vize
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex-1" />

                {/* Footer Info Box */}
                <div className="bg-slate-900 rounded-[2rem] p-8 flex items-center justify-between shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20 pointer-events-none" />

                    <div className="flex items-center gap-5 relative z-10 w-1/2 border-r border-slate-700 pr-8">
                        <div className="bg-slate-800 p-4 rounded-2xl text-emerald-400">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="text-slate-400 text-xs tracking-widest uppercase mb-1 font-bold">Tur Yetkilisi</div>
                            <div className="text-2xl font-black text-white">{data.guideName}</div>
                            {data.isDiyanetPersonnel && (
                                <div className="text-emerald-400 text-[11px] uppercase tracking-widest mt-1 font-bold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Resmi Diyanet Görevlisi
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative z-10 pl-8 flex items-center justify-end w-1/2 gap-4">
                        <div className="bg-emerald-500 p-4 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                            <Phone className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="text-slate-400 text-xs tracking-widest uppercase mb-1 font-bold">Rezervasyon & Bilgi</div>
                            <div className="text-3xl font-black text-white">{data.guidePhone}</div>
                        </div>
                    </div>
                </div>
            </div>

            {showWatermark && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden opacity-5">
                    <div className="text-8xl font-black text-slate-900 -rotate-45 whitespace-nowrap">
                        UMREBULDUM PREMIUM
                    </div>
                </div>
            )}
        </div>
    );
}
