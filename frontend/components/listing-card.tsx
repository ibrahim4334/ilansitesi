import Link from 'next/link';
import { MapPin, Calendar, Star, ShieldCheck, Flame, Plane, Check } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ListingCardProps {
    listing: {
        id: string;
        title: string;
        city: string; // Destination city
        departureCity: string;
        startDate: string;
        endDate: string;
        totalDays: number;
        price: number;
        pricing?: {
            double: number;
            triple: number;
            quad: number;
            currency: string;
        };
        urgencyTag?: string; // "SON_FIRSAT", etc.
        guide: {
            fullName: string;
            city?: string; // Guide base city
            photo?: string;
            isDiyanet: boolean;
            trustScore: number;
            package: string;
        };
        extraServices?: string[];
        isFeatured?: boolean;
        posterImages?: string[];
    };
}

export function ListingCard({ listing }: ListingCardProps) {
    // Determine lowest price
    let minPrice = listing.price;
    if (listing.pricing) {
        const prices = [listing.pricing.quad, listing.pricing.triple, listing.pricing.double].filter(p => p > 0);
        if (prices.length > 0) minPrice = Math.min(...prices);
    }

    const urgencyLabels: Record<string, string> = {
        'SON_FIRSAT': 'Son Fırsat',
        'SINIRLI_KONTENJAN': 'Sınırlı Kontenjan',
        'ERKEN_REZERVASYON': 'Erken Rezervasyon'
    };

    const isDiyanet = listing.guide?.isDiyanet;

    // Aesthetic Rules
    const accentColor = isDiyanet ? "text-teal-600" : "text-cyan-600";
    const badgeColor = isDiyanet ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-cyan-50 text-cyan-700 border-cyan-200";
    const cardBorder = isDiyanet ? "hover:border-teal-300" : "hover:border-cyan-300";
    const buttonClass = isDiyanet ? "bg-teal-600 hover:bg-teal-700" : "bg-cyan-600 hover:bg-cyan-700";

    return (
        <Link href={`/listings/${listing.id}`} className="block h-full">
            <div className={`bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col group ${cardBorder}`}>

                {/* Image Header */}
                <div className="relative h-48 bg-gray-100 rounded-t-xl overflow-hidden">
                    {/* Placeholder or Actual Image */}
                    <img
                        src={listing.posterImages?.[0] || "https://images.unsplash.com/photo-1565552629477-ff72852894c9?w=800&q=80"}
                        alt="Umrah"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Overlays */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
                        {listing.isFeatured && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm border-0">
                                <Star className="w-3 h-3 mr-1 fill-white" /> Öne Çıkan
                            </Badge>
                        )}
                        {isDiyanet && (
                            <Badge className="bg-white/95 text-teal-700 hover:bg-white backdrop-blur-sm shadow-sm border-0">
                                <ShieldCheck className="w-3 h-3 mr-1" /> Diyanet Onaylı
                            </Badge>
                        )}
                        {listing.urgencyTag && (
                            <Badge variant="destructive" className="shadow-sm">
                                <Flame className="w-3 h-3 mr-1" /> {urgencyLabels[listing.urgencyTag] || listing.urgencyTag}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow gap-3">
                    <div className="flex justify-between items-start">
                        <div className="text-[11px] text-gray-500 font-semibold bg-gray-50 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 border border-gray-100">
                            <Plane className="w-3 h-3" /> {listing.departureCity} Çıkışlı
                        </div>
                        <div className="flex items-center text-[11px] text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100/50">
                            <Star className="w-3 h-3 mr-1 fill-amber-500" />
                            {listing.guide?.trustScore || 50} puan
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-cyan-700 transition-colors">
                        {listing.title}
                    </h3>

                    <div className="space-y-2.5">
                        <div className="flex items-center text-sm text-gray-600 gap-2.5">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-medium text-gray-700">{new Date(listing.startDate).toLocaleDateString('tr-TR')} - {listing.totalDays} Gün</span>
                        </div>

                        {/* Guide Location */}
                        <div className="flex items-center text-sm text-gray-600 gap-2.5">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{listing.guide?.city || listing.city || "Suudi Arabistan"}</span>
                        </div>

                        {/* Extra Services Badges */}
                        {listing.extraServices && listing.extraServices.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
                                {listing.extraServices.slice(0, 3).map((s, i) => (
                                    <span key={i} className="text-[10px] bg-gray-50 text-gray-500 font-medium px-2 py-1 rounded-full border border-gray-100 flex items-center">
                                        <Check className="w-2.5 h-2.5 mr-1 text-teal-500" /> {s}
                                    </span>
                                ))}
                                {listing.extraServices.length > 3 && (
                                    <span className="text-[10px] text-gray-400 px-1 py-0.5">+{listing.extraServices.length - 3}</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-5 flex items-end justify-between">
                        <div>
                            <p className="text-[11px] font-medium text-gray-400 mb-0.5">Başlayan fiyatlarla</p>
                            <div className={`text-2xl font-bold tracking-tight ${accentColor}`}>
                                {minPrice} <span className="text-sm font-medium text-gray-400">SAR</span>
                            </div>
                        </div>
                        <Button size="sm" className={`h-9 px-5 rounded-lg font-semibold shadow-sm transition-all hover:shadow-md ${buttonClass}`}>
                            İncele
                        </Button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
