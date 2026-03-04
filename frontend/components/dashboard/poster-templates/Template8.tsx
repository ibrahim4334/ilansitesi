import React from 'react';
import { Calendar, Phone, User, CheckCircle2, Navigation } from 'lucide-react';
import { PosterData } from '@/components/dashboard/poster-generator/PosterBuilder';
import { STOCK_BACKGROUNDS } from '@/components/dashboard/poster-generator/poster-assets';

export function Template8({ data, id, showWatermark = true }: { data: PosterData; id?: string, showWatermark?: boolean }) {
    const bgImage = STOCK_BACKGROUNDS.find(b => b.id === data.backgroundImage)?.url || STOCK_BACKGROUNDS[0].url;

    return (
        <div
            id={id}
            className="w-full h-full relative overflow-hidden bg-[#1e1b4b] flex flex-col font-sans template-container"
            style={{
                fontFamily: data.fontStyle === 'font-serif' ? 'Georgia, serif' : data.fontStyle === 'font-display' ? 'Impact, sans-serif' : 'Arial, sans-serif',
            }}
        >
            {/* Background Image very faint */}
            <div className="absolute inset-0 z-0">
                <img
                    src={bgImage}
                    alt="Umrah"
                    className="w-full h-full object-cover opacity-20 filter grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#312e81]/80 to-[#1e1b4b]" />
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col z-10 p-12 relative">

                {/* Header Frame */}
                <div className="border border-indigo-500/30 rounded-[40px] p-12 mb-10 text-center bg-[#1e1b4b]/50 backdrop-blur-md shadow-2xl relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-6 py-2 rounded-full text-xs uppercase tracking-[0.3em] font-bold shadow-lg shadow-indigo-500/50">
                        Vip Organizasyon
                    </div>

                    <h1 className="text-6xl font-light text-white tracking-widest uppercase mb-8 leading-tight">
                        {data.title}
                    </h1>

                    <div className="flex justify-center items-center gap-3 text-2xl font-light text-indigo-200">
                        <Calendar className="w-6 h-6 text-indigo-400" />
                        Gidiş: <strong className="font-bold text-white">{data.date}</strong>
                    </div>
                </div>

                {/* 3 Column Data Phase */}
                <div className="grid grid-cols-3 gap-6 mb-10">
                    {[
                        { title: "4 KİŞİLİK ODA", price: data.price4Person, active: false },
                        { title: "3 KİŞİLİK ODA", price: data.price3Person, active: true },
                        { title: "2 KİŞİLİK ODA", price: data.price2Person, active: false }
                    ].map((col, i) => (
                        <div key={i} className={`rounded-3xl p-8 text-center flex flex-col items-center justify-center border transition-all ${col.active ? 'bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-600/30 transform scale-105' : 'bg-[#312e81]/50 border-indigo-500/20 backdrop-blur-md'}`}>
                            <div className={`text-[11px] font-bold tracking-[0.2em] mb-4 uppercase ${col.active ? 'text-indigo-100' : 'text-indigo-300'}`}>{col.title}</div>
                            <div className={`text-5xl font-black ${col.active ? 'text-white' : 'text-indigo-100'}`}>{col.price}</div>
                        </div>
                    ))}
                </div>

                <div className="flex-1" />

                {/* Bottom Details Row */}
                <div className="flex items-end justify-between gap-8">
                    {/* Hotels and Features */}
                    <div className="flex-1 bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 space-y-6">
                        <div className="text-indigo-300 text-xs font-bold uppercase tracking-widest border-b border-indigo-500/20 pb-4 mb-4">
                            Dahil Hizmetlerimiz
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-indigo-100 text-sm font-medium">
                            <div className="flex items-center gap-3">
                                <Navigation className="w-5 h-5 text-indigo-400" /> Mekke: {data.hotelMecca}
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-indigo-400" /> Vize & Ulaşım İçi Transferler
                            </div>
                            <div className="flex items-center gap-3">
                                <Navigation className="w-5 h-5 text-indigo-400" /> Medine: {data.hotelMedina}
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-indigo-400" /> Tur Rehberliği Eğitimleri
                            </div>
                        </div>
                    </div>

                    {/* Guide Card */}
                    <div className="w-[350px] bg-indigo-500/10 backdrop-blur-xl rounded-[40px] p-8 border border-indigo-400/30 flex flex-col items-center text-center shadow-2xl">
                        <div className="w-20 h-20 rounded-full bg-[#1e1b4b] border-2 border-indigo-400 flex items-center justify-center mb-6 shadow-inner">
                            <User className="w-10 h-10 text-indigo-300" />
                        </div>
                        <div className="text-indigo-200 text-[10px] tracking-widest font-bold uppercase mb-2">Tur Sorumlusu</div>
                        <div className="text-3xl font-light text-white mb-2">{data.guideName}</div>

                        {data.isDiyanetPersonnel && (
                            <div className="text-emerald-400 text-[10px] uppercase tracking-widest flex items-center gap-1.5 font-bold bg-emerald-950/50 px-3 py-1.5 rounded-full mb-6 border border-emerald-500/30">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Resmi Diyanet Personeli
                            </div>
                        )}
                        {!data.isDiyanetPersonnel && <div className="h-6 mb-6" />}

                        <div className="w-full bg-white text-indigo-900 py-4 rounded-2xl flex items-center justify-center gap-3 text-2xl font-bold shadow-lg shadow-white/10 mt-auto">
                            <Phone className="w-6 h-6" />
                            {data.guidePhone}
                        </div>
                    </div>
                </div>
            </div>

            {showWatermark && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.05]">
                    <div className="text-[150px] font-black text-white/50 -rotate-45 whitespace-nowrap">
                        UMREBULDUM
                    </div>
                </div>
            )}
        </div>
    );
}
