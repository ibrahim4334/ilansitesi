import React from 'react';
import { Phone, User, CheckCircle2, Hexagon, Star } from 'lucide-react';
import { PosterData } from '@/components/dashboard/poster-generator/PosterBuilder';
import { STOCK_BACKGROUNDS } from '@/components/dashboard/poster-generator/poster-assets';

export function Template5({ data, id, showWatermark = true }: { data: PosterData; id?: string, showWatermark?: boolean }) {
    const bgImage = STOCK_BACKGROUNDS.find(b => b.id === data.backgroundImage)?.url || STOCK_BACKGROUNDS[0].url;

    return (
        <div
            id={id}
            className="w-full h-full relative overflow-hidden bg-white flex flex-col font-sans template-container"
            style={{
                fontFamily: data.fontStyle === 'font-serif' ? 'Georgia, serif' : data.fontStyle === 'font-display' ? 'Impact, sans-serif' : 'Arial, sans-serif',
                border: '12px solid #b8860b' // Dark Goldenrod
            }}
        >
            {/* Top Ornamental Header & Image */}
            <div className="h-[45%] w-full relative bg-[#fafafa]">
                {/* Background Image Layer */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${bgImage})` }}
                />

                {/* Gradient to white */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-black/30" />

                {/* Header Strip overlay */}
                <div className="absolute top-0 inset-x-0 h-24 flex items-center justify-center bg-white/10 backdrop-blur-sm border-b border-white/20">
                    <div className="text-xl font-serif text-white tracking-[0.6em] uppercase drop-shadow-md">UMREBULDUM</div>
                    <Hexagon className="absolute left-16 text-[#b8860b] w-8 h-8 opacity-80" />
                    <Hexagon className="absolute right-16 text-[#b8860b] w-8 h-8 opacity-80" />
                </div>

                <div className="absolute bottom-12 inset-x-0 px-16 text-center">
                    <h1 className="text-6xl font-serif italic text-slate-900 drop-shadow-sm leading-tight leading-snug">
                        {data.title}
                    </h1>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <Star className="w-5 h-5 text-[#b8860b] fill-current" />
                        <Star className="w-5 h-5 text-[#b8860b] fill-current" />
                        <Star className="w-5 h-5 text-[#b8860b] fill-current" />
                        <Star className="w-5 h-5 text-[#b8860b] fill-current" />
                        <Star className="w-5 h-5 text-[#b8860b] fill-current" />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-16 pt-4 pb-12 flex flex-col relative bg-white">

                {/* Pricing Table (Elegant Flex Layout) */}
                <div className="bg-[#fafafa] rounded-[40px] border border-[#f0f0f0] p-10 mb-8 shadow-sm">
                    <div className="flex justify-between items-center mb-8 border-b border-[#e5e5e5] pb-6">
                        <div className="text-2xl font-serif text-slate-800">Paket Seçenekleri</div>
                        <div className="flex items-center gap-2 bg-[#b8860b]/10 text-[#b8860b] px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase">
                            Özel Fiyatlar
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                        {[
                            { title: "4 Kişilik Oda", price: data.price4Person },
                            { title: "3 Kişilik Oda", price: data.price3Person },
                            { title: "2 Kişilik Oda", price: data.price2Person }
                        ].map((col, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="text-sm uppercase tracking-widest text-slate-500 mb-2">{col.title}</div>
                                <div className="text-4xl font-light text-[#b8860b] mb-4">{col.price}</div>
                                <div className="h-10 w-px bg-[#e5e5e5]" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hotel Details Grid */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-xl text-slate-600 mb-auto mt-4 px-4">
                    <div className="flex items-center gap-4">
                        <CheckCircle2 className="w-6 h-6 text-[#b8860b] flex-shrink-0" />
                        <span>Mekke: <b className="text-slate-800 font-medium">{data.hotelMecca}</b></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <CheckCircle2 className="w-6 h-6 text-[#b8860b] flex-shrink-0" />
                        <span>Medine: <b className="text-slate-800 font-medium">{data.hotelMedina}</b></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <CheckCircle2 className="w-6 h-6 text-[#b8860b] flex-shrink-0" />
                        <span>Rehberlik Hizmeti</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <CheckCircle2 className="w-6 h-6 text-[#b8860b] flex-shrink-0" />
                        <span>Seyahat ve Vize</span>
                    </div>
                </div>

                {/* Elegant Footer */}
                <div className="mt-12 pt-8 border-t border-[#f0f0f0] flex items-center justify-between px-4">
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 rounded-full bg-[#fafafa] border border-[#e5e5e5] flex items-center justify-center">
                            <User className="w-8 h-8 text-[#b8860b]" />
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-widest text-[#888] mb-1 font-bold">Tur Koordinatörü</div>
                            <div className="text-2xl font-serif text-slate-800">{data.guideName}</div>
                            {data.isDiyanetPersonnel && (
                                <div className="text-emerald-600 text-[10px] uppercase tracking-widest mt-1.5 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full w-max border border-emerald-100">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Diyanet Personeli
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 relative z-10 text-right">
                        <div>
                            <div className="text-xs text-[#888] uppercase tracking-widest mb-1 font-bold">Rezervasyon</div>
                            <div className="text-2xl font-light tracking-wide text-slate-800">{data.guidePhone}</div>
                        </div>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#b8860b] text-white shadow-lg shadow-amber-900/20">
                            <Phone className="w-7 h-7" />
                        </div>
                    </div>
                </div>
            </div>

            {showWatermark && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none opacity-5">
                    <span className="text-8xl font-black transform -rotate-45" style={{ color: '#000000' }}>UMREBULDUM</span>
                </div>
            )}
        </div>
    );
}
