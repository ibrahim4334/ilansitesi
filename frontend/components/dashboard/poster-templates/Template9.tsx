import React from 'react';
import { Calendar, Phone, User, CheckCircle2, Navigation } from 'lucide-react';
import { PosterData } from '@/components/dashboard/poster-generator/PosterBuilder';
import { STOCK_BACKGROUNDS } from '@/components/dashboard/poster-generator/poster-assets';

export function Template9({ data, id, showWatermark = true }: { data: PosterData; id?: string, showWatermark?: boolean }) {
    const bgImage = STOCK_BACKGROUNDS.find(b => b.id === data.backgroundImage)?.url || STOCK_BACKGROUNDS[0].url;

    return (
        <div
            id={id}
            className="w-full h-full relative overflow-hidden bg-orange-50 flex flex-col font-sans template-container"
            style={{
                fontFamily: data.fontStyle === 'font-serif' ? 'Georgia, serif' : data.fontStyle === 'font-display' ? 'Impact, sans-serif' : 'system-ui, sans-serif',
            }}
        >
            {/* Top Pattern Header */}
            <div className="h-48 w-full bg-orange-900 relative flex items-center justify-center border-b-[16px] border-orange-500">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                <h1 className="text-5xl font-black text-white tracking-widest uppercase relative z-10 px-12 text-center">
                    {data.title}
                </h1>
            </div>

            {/* Central Content Area */}
            <div className="flex-1 px-12 py-10 flex flex-col relative z-20">

                {/* Image and Price Row */}
                <div className="flex gap-8 mb-10 h-72">
                    <div className="flex-1 bg-white rounded-3xl p-3 shadow-xl transform -rotate-2">
                        <div
                            className="w-full h-full rounded-2xl bg-cover bg-center"
                            style={{ backgroundImage: `url(${bgImage})` }}
                        />
                    </div>

                    <div className="w-[40%] flex flex-col gap-4">
                        <div className="bg-orange-600 text-white rounded-3xl p-6 shadow-lg flex-1 flex flex-col justify-center items-center text-center transform translate-y-4">
                            <div className="text-orange-200 text-xs font-bold uppercase tracking-widest mb-2">Başlangıç Fiyatı</div>
                            <div className="text-5xl font-black">{data.price4Person}</div>
                        </div>
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100 flex items-center justify-center gap-4 text-orange-900 transform translate-y-4">
                            <Calendar className="w-8 h-8 text-orange-500" />
                            <div className="text-2xl font-bold">{data.date}</div>
                        </div>
                    </div>
                </div>

                {/* Pricing Table Alternative */}
                <div className="bg-white rounded-[40px] shadow-xl border-2 border-orange-100 p-8 mb-10 relative">
                    <div className="absolute top-0 right-12 transform -translate-y-1/2 bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest">
                        Oda Seçenekleri
                    </div>

                    <div className="grid grid-cols-3 divide-x-2 divide-orange-50">
                        {[
                            { title: "İkili Oda", price: data.price2Person, desc: "2 Kişilik" },
                            { title: "Üçlü Oda", price: data.price3Person, desc: "3 Kişilik" },
                            { title: "Dörtlü Oda", price: data.price4Person, desc: "4 Kişilik" }
                        ].map((col, i) => (
                            <div key={i} className="flex flex-col items-center px-4">
                                <div className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-1">{col.desc}</div>
                                <div className="text-lg font-bold text-slate-800 mb-3">{col.title}</div>
                                <div className="text-3xl font-black text-orange-600">{col.price}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Details Row */}
                <div className="flex justify-between items-stretch gap-6 h-full mb-4">

                    {/* Hotels Card */}
                    <div className="w-[55%] bg-orange-900 rounded-[32px] p-8 text-white relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-orange-500 rounded-tl-full opacity-20" />

                        <div className="text-orange-300 text-xs font-bold uppercase tracking-widest mb-6">Konaklama Bilgileri</div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="bg-orange-800 p-3 rounded-xl"><Navigation className="w-6 h-6 text-orange-300" /></div>
                                <div>
                                    <div className="text-[10px] text-orange-400 uppercase tracking-widest">Mekke Oteli</div>
                                    <div className="text-xl font-bold">{data.hotelMecca}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-orange-800 p-3 rounded-xl"><Navigation className="w-6 h-6 text-orange-300" /></div>
                                <div>
                                    <div className="text-[10px] text-orange-400 uppercase tracking-widest">Medine Oteli</div>
                                    <div className="text-xl font-bold">{data.hotelMedina}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Guide Card Vertical */}
                    <div className="w-[45%] bg-white rounded-[32px] p-8 border-2 border-orange-100 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full" />

                        <div className="w-20 h-20 rounded-full bg-orange-100 border-4 border-white shadow-md flex items-center justify-center mb-4 relative z-10">
                            <User className="w-10 h-10 text-orange-500" />
                        </div>

                        <div className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Tur Rehberi</div>
                        <div className="text-2xl font-bold text-slate-800 mb-2">{data.guideName}</div>

                        {data.isDiyanetPersonnel && (
                            <div className="bg-emerald-50 text-emerald-600 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 mb-auto border border-emerald-100">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Diyanet Görevlisi
                            </div>
                        )}
                        {!data.isDiyanetPersonnel && <div className="mb-auto" />}

                        <div className="w-full bg-orange-500 text-white rounded-2xl py-4 flex items-center justify-center gap-3 text-2xl font-bold shadow-lg shadow-orange-500/30 mt-6">
                            <Phone className="w-6 h-6" />
                            {data.guidePhone}
                        </div>
                    </div>

                </div>
            </div>

            {showWatermark && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.03]">
                    <div className="text-9xl font-black text-orange-900 -rotate-45 whitespace-nowrap">
                        UMREBULDUM
                    </div>
                </div>
            )}
        </div>
    );
}
