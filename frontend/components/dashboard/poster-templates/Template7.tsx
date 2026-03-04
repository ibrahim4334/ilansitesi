import React from 'react';
import { Calendar, Phone, User, CheckCircle2, MapPin } from 'lucide-react';
import { PosterData } from '@/components/dashboard/poster-generator/PosterBuilder';
import { STOCK_BACKGROUNDS } from '@/components/dashboard/poster-generator/poster-assets';

export function Template7({ data, id, showWatermark = true }: { data: PosterData; id?: string, showWatermark?: boolean }) {
    const bgImage = STOCK_BACKGROUNDS.find(b => b.id === data.backgroundImage)?.url || STOCK_BACKGROUNDS[0].url;

    return (
        <div
            id={id}
            className="w-full h-full relative overflow-hidden bg-slate-100 flex flex-col font-sans template-container"
            style={{
                fontFamily: data.fontStyle === 'font-serif' ? 'Georgia, serif' : data.fontStyle === 'font-display' ? 'Impact, sans-serif' : 'system-ui, sans-serif',
            }}
        >
            {/* Center Image Banner with curved bottom */}
            <div className="h-[55%] w-[90%] mx-auto mt-12 relative rounded-[60px] shadow-2xl overflow-hidden border-8 border-white">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${bgImage})` }}
                />
                <div className="absolute inset-0 bg-black/20" />

                {/* Floating Title on Image */}
                <div className="absolute bottom-12 left-12 right-12 bg-white/90 backdrop-blur-md p-8 rounded-[40px] shadow-2xl text-center">
                    <div className="text-rose-600 tracking-[0.3em] font-bold text-sm uppercase mb-3">Huzura Yolculuk</div>
                    <h1 className="text-5xl font-black text-slate-900 leading-tight">
                        {data.title}
                    </h1>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col pt-12 px-16 pb-12">

                {/* 3 Column Data Phase */}
                <div className="grid grid-cols-3 gap-6 mb-12">
                    {[
                        { title: "4 KİŞİLİK", price: data.price4Person },
                        { title: "3 KİŞİLİK", price: data.price3Person },
                        { title: "2 KİŞİLİK", price: data.price2Person }
                    ].map((col, i) => (
                        <div key={i} className="bg-white rounded-3xl p-8 shadow-lg shadow-slate-200/50 flex flex-col items-center text-center relative overflow-hidden group">
                            <div className="absolute top-0 inset-x-0 h-2 bg-rose-500 transform origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                            <div className="text-slate-400 font-bold tracking-widest text-sm mb-4 bg-slate-50 px-4 py-2 rounded-full w-full">{col.title} ODA</div>
                            <div className="text-4xl font-black text-rose-600">{col.price}</div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-stretch gap-8 mb-auto">
                    {/* Hotels Card */}
                    <div className="flex-1 bg-slate-800 text-white rounded-[40px] p-8 shadow-xl flex flex-col justify-center space-y-5 relative overflow-hidden">
                        <div className="absolute -right-12 -top-12 w-40 h-40 bg-slate-700 rounded-full opacity-50 blur-2xl pointer-events-none" />
                        <div className="flex items-center gap-4 text-xl">
                            <div className="bg-slate-700 p-3 rounded-2xl text-rose-400"><MapPin className="w-6 h-6" /></div>
                            <div>
                                <div className="text-sm text-slate-400 uppercase tracking-widest font-bold">Mekke Oteli</div>
                                <div className="font-bold text-white">{data.hotelMecca}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xl">
                            <div className="bg-slate-700 p-3 rounded-2xl text-rose-400"><MapPin className="w-6 h-6" /></div>
                            <div>
                                <div className="text-sm text-slate-400 uppercase tracking-widest font-bold">Medine Oteli</div>
                                <div className="font-bold text-white">{data.hotelMedina}</div>
                            </div>
                        </div>
                    </div>

                    {/* Date Card */}
                    <div className="w-1/3 bg-rose-500 text-white rounded-[40px] p-8 shadow-xl shadow-rose-500/20 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-rose-600 rounded-full opacity-50 blur-2xl pointer-events-none" />
                        <Calendar className="w-12 h-12 mb-4 text-rose-100 relative z-10" />
                        <div className="text-sm uppercase tracking-widest text-rose-200 font-bold mb-2 relative z-10">Gidiş Tarihi</div>
                        <div className="text-3xl font-black relative z-10">{data.date}</div>
                    </div>
                </div>

                {/* Guide Footer */}
                <div className="mt-8 bg-white rounded-[40px] p-6 shadow-lg flex items-center justify-between border border-slate-100">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                            <User className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                            <div className="text-slate-400 text-[10px] tracking-widest uppercase font-bold mb-1">Rehber ve Bilgi</div>
                            <div className="text-2xl font-black text-slate-800">{data.guideName}</div>
                            {data.isDiyanetPersonnel && (
                                <div className="text-emerald-500 text-[10px] uppercase tracking-widest flex items-center gap-1 font-bold mt-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Diyanet Personeli
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-3xl font-black text-slate-800 bg-slate-50 px-6 py-4 rounded-3xl">
                        <Phone className="w-7 h-7 text-rose-500" />
                        {data.guidePhone}
                    </div>
                </div>

            </div>

            {showWatermark && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.03]">
                    <div className="text-9xl font-black text-slate-900 -rotate-45 whitespace-nowrap">
                        UMREBULDUM
                    </div>
                </div>
            )}
        </div>
    );
}
