import React from 'react';
import { Calendar, Phone, User, CheckCircle2, Navigation } from 'lucide-react';
import { PosterData } from '@/components/dashboard/poster-generator/PosterBuilder';
import { STOCK_BACKGROUNDS } from '@/components/dashboard/poster-generator/poster-assets';

export function Template10({ data, id, showWatermark = true }: { data: PosterData; id?: string, showWatermark?: boolean }) {
    const bgImage = STOCK_BACKGROUNDS.find(b => b.id === data.backgroundImage)?.url || STOCK_BACKGROUNDS[0].url;

    return (
        <div
            id={id}
            className="w-full h-full relative overflow-hidden bg-slate-900 flex flex-col font-sans template-container"
            style={{
                fontFamily: data.fontStyle === 'font-serif' ? 'Georgia, serif' : data.fontStyle === 'font-display' ? 'Impact, sans-serif' : 'system-ui, sans-serif',
            }}
        >
            {/* Background Full Cover with gradient Map */}
            <div className="absolute inset-0 z-0">
                <img
                    src={bgImage}
                    alt="Umrah"
                    className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-900/60" />
            </div>

            {/* Inner Content Border */}
            <div className="absolute inset-6 border border-white/10 rounded-3xl z-10 pointer-events-none" />

            <div className="flex-1 flex flex-col z-20 p-16">

                {/* Header (Top-Left Aligned) */}
                <div className="mb-16">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-[1px] w-12 bg-sky-400" />
                        <div className="text-sky-400 tracking-[0.3em] text-xs font-bold uppercase">UMREBULDUM ORGANİZASYON</div>
                    </div>
                    <h1 className="text-6xl font-black text-white leading-tight uppercase max-w-2xl">
                        {data.title}
                    </h1>
                </div>

                {/* Pricing row */}
                <div className="flex items-center justify-between mb-16">
                    <div className="flex gap-6 w-[70%]">
                        {[
                            { title: "2 KİŞİLİK ODA", price: data.price2Person },
                            { title: "3 KİŞİLİK ODA", price: data.price3Person },
                            { title: "4 KİŞİLİK ODA", price: data.price4Person }
                        ].map((col, i) => (
                            <div key={i} className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition">
                                <div className="text-slate-400 text-[10px] font-bold tracking-[0.2em] mb-2 uppercase">{col.title}</div>
                                <div className="text-3xl font-black text-white">{col.price}</div>
                            </div>
                        ))}
                    </div>

                    <div className="w-[25%] flex justify-end">
                        <div className="w-32 h-32 rounded-full border border-sky-500/30 flex flex-col items-center justify-center bg-sky-500/10 backdrop-blur-sm text-sky-400">
                            <Calendar className="w-8 h-8 mb-2" />
                            <div className="text-xs font-bold uppercase tracking-widest text-white">{data.date}</div>
                        </div>
                    </div>
                </div>

                {/* Features and Hotels */}
                <div className="flex justify-between gap-12 mb-auto">
                    <div className="w-1/2 space-y-6">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-2">Konaklama Tesisleri</div>
                        <div className="flex items-start gap-4 text-slate-300 bg-white/5 p-4 rounded-xl">
                            <Navigation className="w-6 h-6 text-sky-400 flex-shrink-0 mt-1" />
                            <div>
                                <div className="text-xs uppercase text-slate-500 font-bold mb-1">Mekke</div>
                                <div className="text-lg text-white font-medium">{data.hotelMecca}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 text-slate-300 bg-white/5 p-4 rounded-xl">
                            <Navigation className="w-6 h-6 text-sky-400 flex-shrink-0 mt-1" />
                            <div>
                                <div className="text-xs uppercase text-slate-500 font-bold mb-1">Medine</div>
                                <div className="text-lg text-white font-medium">{data.hotelMedina}</div>
                            </div>
                        </div>
                    </div>

                    <div className="w-1/2 space-y-6">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-2">Hizmet Kapsamı</div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex items-center gap-3 text-slate-300">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                Vize ve Tüm Transferler
                            </div>
                            <div className="flex items-center gap-3 text-slate-300">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                Diyanet İşleri Onaylı Program
                            </div>
                            <div className="flex items-center gap-3 text-slate-300">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                Profesyonel Rehberlik Eğitimi
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Guide Info */}
                <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center p-1">
                            <User className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Tur Yöneticisi</div>
                            <div className="text-2xl font-bold text-white mb-1">{data.guideName}</div>
                            {data.isDiyanetPersonnel && (
                                <div className="text-emerald-400 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Diyanet Uzman Rehberi
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-sky-500/20 border border-sky-500/30 px-8 py-4 rounded-2xl flex items-center gap-4 text-white">
                        <div className="bg-sky-500 p-2 rounded-lg"><Phone className="w-6 h-6" /></div>
                        <div className="text-3xl font-black">{data.guidePhone}</div>
                    </div>
                </div>
            </div>

            {showWatermark && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.02]">
                    <div className="text-[120px] font-black text-white -rotate-12 whitespace-nowrap">
                        UMREBULDUM
                    </div>
                </div>
            )}
        </div>
    );
}
