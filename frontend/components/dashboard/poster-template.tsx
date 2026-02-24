import React from 'react';
import { Calendar, Phone, User, CheckCircle2 } from 'lucide-react';

interface PosterTemplateProps {
    data: {
        title: string;
        price: string;
        date: string;
        guideName: string;
        guidePhone: string;
        image?: string;
        features?: string[];
        hotel?: string;
    };
    id?: string; // ID for html2canvas targeting
}

export function PosterTemplate({ data, id }: PosterTemplateProps) {
    return (
        <div
            id={id}
            className="w-[1080px] h-[1350px] relative overflow-hidden flex flex-col font-sans"
            style={{
                transformOrigin: 'top left',
                backgroundColor: '#ffffff',
                color: '#111827'
            }}
        >
            {/* Header / Brand */}
            <div
                className="absolute top-0 left-0 w-full h-32 z-10 flex items-center justify-between px-12"
                style={{ background: 'linear-gradient(to right, #1e3a8a, #1e40af)' }}
            >
                <div className="font-bold text-4xl tracking-wider" style={{ color: '#ffffff' }}>UMREBULDUM</div>
                <div className="px-6 py-2 rounded-full font-medium backdrop-blur-sm" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }}>
                    Özel Umre Turu
                </div>
            </div>

            {/* Hero Image */}
            <div className="relative h-[600px] w-full">
                <img
                    src={data.image || "https://images.unsplash.com/photo-1565552629477-ff72852894c9?w=1080&q=80"}
                    alt="Umrah"
                    className="w-full h-full object-cover"
                />
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(30,58,138,0.9), transparent)' }}
                />

                {/* Price Tag Overlay */}
                <div
                    className="absolute bottom-12 right-12 px-10 py-6 rounded-2xl shadow-2xl transform rotate-[-2deg]"
                    style={{ backgroundColor: '#f59e0b', color: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                >
                    <div className="text-2xl font-medium opacity-90">Başlayan Fiyatlarla</div>
                    <div className="text-6xl font-bold tracking-tight">{data.price}</div>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-16 flex flex-col gap-10" style={{ backgroundColor: '#ffffff' }}>

                {/* Title */}
                <h1 className="text-6xl font-extrabold leading-tight" style={{ color: '#172554' }}>
                    {data.title}
                </h1>

                {/* Date & Hotel Grid */}
                <div className="grid grid-cols-2 gap-8">
                    <div className="p-6 rounded-2xl border flex items-center gap-6" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
                            <Calendar className="w-8 h-8" style={{ color: '#2563eb' }} />
                        </div>
                        <div>
                            <div className="text-lg font-medium" style={{ color: '#1e40af' }}>Tarih</div>
                            <div className="text-3xl font-bold" style={{ color: '#172554' }}>{data.date}</div>
                        </div>
                    </div>
                </div>

                {/* Features List */}
                {data.features && data.features.length > 0 && (
                    <div className="mt-4">
                        <h3 className="text-2xl font-bold mb-6" style={{ color: '#1f2937' }}>Tur Özellikleri</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {data.features.slice(0, 6).map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 text-xl" style={{ color: '#374151' }}>
                                    <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color: '#22c55e' }} />
                                    <span>{feature}</span>
                                </div>
                            ))}
                            {data.hotel && (
                                <div className="flex items-center gap-3 text-xl col-span-2" style={{ color: '#374151' }}>
                                    <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color: '#22c55e' }} />
                                    <span>Konaklama: <strong>{data.hotel}</strong></span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Contact */}
            <div className="p-12 border-t mt-auto" style={{ backgroundColor: '#f9fafb', borderColor: '#f3f4f6' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg" style={{ backgroundColor: '#e5e7eb', borderColor: '#ffffff' }}>
                            {/* Generic Avatar / Placeholder if none */}
                            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#d1d5db', color: '#6b7280' }}>
                                <User className="w-10 h-10" />
                            </div>
                        </div>
                        <div>
                            <div className="text-xl font-medium" style={{ color: '#6b7280' }}>Tur Rehberi</div>
                            <div className="text-4xl font-bold" style={{ color: '#111827' }}>{data.guideName}</div>
                        </div>
                    </div>

                    <div className="px-10 py-5 rounded-xl shadow-lg flex items-center gap-4" style={{ backgroundColor: '#2563eb', color: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                        <Phone className="w-8 h-8" />
                        <div className="text-3xl font-bold tracking-wide">{data.guidePhone}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
