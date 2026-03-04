import React from 'react';
import { Phone, User, CheckCircle2, Award } from 'lucide-react';
import { PosterData } from '@/components/dashboard/poster-generator/PosterBuilder';
import { STOCK_BACKGROUNDS, FRAME_STYLES, FONT_STYLES } from '@/components/dashboard/poster-generator/poster-assets';

export function Template1({ data, id, showWatermark = true }: { data: PosterData; id?: string, showWatermark?: boolean }) {

    const bgImage = STOCK_BACKGROUNDS.find(b => b.id === data.backgroundImage)?.url || STOCK_BACKGROUNDS[0].url;

    return (
        <div
            id={id}
            className="w-full h-full relative overflow-hidden bg-white flex flex-col justify-end template-container"
            style={{
                fontFamily: data.fontStyle === 'font-serif' ? 'Georgia, serif' : data.fontStyle === 'font-display' ? 'Impact, sans-serif' : 'Arial, sans-serif'
            }}
        >
            {/* Background Image Layer (Top Half/Full Bleed) */}
            <div
                className="absolute inset-x-0 top-0 bottom-[40%] bg-cover bg-center"
                style={{ backgroundImage: `url(${bgImage})` }}
            />

            {/* Gradient Transition */}
            <div className="absolute inset-x-0 top-[30%] bottom-[40%] bg-gradient-to-b from-transparent to-[#1a1814]" />

            {/* Ornate Frame Layer (Bottom Half) */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end">
                {/* SVG Ornate Frame Path (Simulating the wavy gold border) */}
                <div className={`w-full h-[60%] bg-[#1a1814] relative ${data.frameStyle === 'frame-modern' ? 'border-t-8 border-dashed border-[#d4af37]' :
                        data.frameStyle === 'frame-gold' ? 'border-4 border-double border-[#d4af37] m-4 rounded-xl' :
                            'border-t-4 border-[#d4af37]'
                    }`}>
                    {/* Hanging Lanterns (Decorative) */}
                    <div className="absolute -top-16 left-8 text-[#d4af37] opacity-80">
                        <svg width="40" height="auto" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15 8H9L12 2ZM7 10H17L16 18H8L7 10Z" /></svg>
                    </div>
                    <div className="absolute -top-24 right-8 text-[#d4af37] opacity-80">
                        <svg width="40" height="auto" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15 8H9L12 2ZM7 10H17L16 18H8L7 10Z" /></svg>
                    </div>

                    <div className="p-12 relative h-full flex flex-col">

                        {/* Title and Base Price Row */}
                        <div className="flex justify-between items-end border-b border-[#d4af37]/30 pb-6 mb-8">
                            <h1 className="text-6xl font-black text-[#d4af37] tracking-tight w-2/3 leading-none uppercase">
                                {data.title}
                            </h1>
                            <div className="text-right">
                                <div className="text-6xl font-black text-white">{data.price4Person}</div>
                                <div className="text-lg text-slate-300 italic mt-2">'dan başlayan fiyatlar</div>
                            </div>
                        </div>

                        {/* Agency Description (Hardcoded placeholder based on mockup) */}
                        <p className="text-slate-300 text-lg text-center mx-auto max-w-2xl mb-10">
                            İnanç, tevekkül ve bağlılık dolu bir yolculuğu kolaylaştırıyoruz. Sizi en güzel şekilde ağırlamak için buradayız.
                        </p>

                        <div className="flex items-center justify-center my-4 mb-10">
                            <div className="h-px w-24 bg-[#d4af37]"></div>
                            <span className="mx-4 text-[#d4af37] font-bold text-xl px-6 py-2 border border-[#d4af37] rounded-full">Paket Seçeneklerimiz</span>
                            <div className="h-px w-24 bg-[#d4af37]"></div>
                        </div>

                        {/* Pricing Columns */}
                        <div className="grid grid-cols-3 gap-6 mb-auto">
                            {[
                                { title: "4 KİŞİLİK ODA", price: data.price4Person, mecca: data.hotelMecca, medina: data.hotelMedina },
                                { title: "3 KİŞİLİK ODA", price: data.price3Person, mecca: data.hotelMecca, medina: data.hotelMedina },
                                { title: "2 KİŞİLİK ODA", price: data.price2Person, mecca: data.hotelMecca, medina: data.hotelMedina }
                            ].map((col, i) => (
                                <div key={i} className="bg-[#2c2822] border-2 border-[#d4af37] rounded-xl overflow-hidden flex flex-col text-center shadow-2xl relative">
                                    <div className="bg-[#d4af37] text-[#1a1814] py-4 rounded-b-[40px] px-4 font-black">
                                        <div className="text-sm tracking-widest opacity-80">{col.title}</div>
                                        <div className="text-4xl mt-1">{col.price}</div>
                                    </div>
                                    <div className="p-6 text-white space-y-4 font-medium text-lg flex-1">
                                        <div className="border-b border-white/10 pb-2">{col.medina}</div>
                                        <div className="border-b border-white/10 pb-2">{col.mecca}</div>
                                        <div className="border-b border-white/10 pb-2">Vize & Uçak Bileti</div>
                                        <div className="text-[#d4af37]">Lüks Servis</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Bar */}
                <div className="h-24 bg-[#d4af37] w-full flex items-center justify-between px-10 relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                    <div className="text-[#1a1814] font-black text-2xl tracking-widest">
                        UMREBULDUM.COM
                    </div>
                    <div className="bg-white px-8 py-3 rounded-full shadow-lg absolute left-1/2 -translate-x-1/2 -top-6 border-4 border-[#d4af37] flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">İrtibat Numarası</span>
                        <div className="flex items-center gap-2 text-2xl font-black text-[#1a1814]">
                            <Phone className="w-5 h-5" /> {data.guidePhone}
                        </div>
                    </div>
                    <div className="flex flex-col items-end text-[#1a1814]">
                        <div className="font-black text-2xl uppercase flex items-center gap-2">
                            <User className="w-6 h-6" /> {data.guideName}
                        </div>
                        {data.isDiyanetPersonnel && (
                            <div className="flex items-center gap-1 text-sm font-bold bg-[#1a1814] text-white px-3 py-1 rounded-full mt-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Tecrübeli Diyanet Personeli
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Watermark Filter */}
            {showWatermark && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden mix-blend-overlay opacity-30">
                    <div className="text-8xl font-black text-white/50 -rotate-45 whitespace-nowrap transform scale-150">
                        UMREBULDUM UMREBULDUM UMREBULDUM
                    </div>
                </div>
            )}
        </div>
    );
}
