import Link from 'next/link';
import { MapPin, Calendar, Star, ShieldCheck, Flame } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ListingCardProps {
    listing: {
        id: string;
        title: string;
        city: string; // Saudi city
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
            photo?: string;
            isDiyanet: boolean;
            trustScore: number;
            package: string;
        };
        posterImages?: string[]; // Todo: add support
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
    const accentColor = isDiyanet ? "text-teal-600" : "text-blue-600";
    const badgeColor = isDiyanet ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-blue-50 text-blue-700 border-blue-200";
    const cardBorder = isDiyanet ? "hover:border-teal-300" : "hover:border-blue-300";

    return (
        <Link href={`/listings/${listing.id}`} className="block h-full">
            <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col group ${cardBorder}`}>

                {/* Image Header */}
                <div className="relative h-48 bg-gray-100 rounded-t-xl overflow-hidden">
                    {/* Placeholder or Actual Image */}
                    <img
                        src="https://images.unsplash.com/photo-1565552629477-ff72852894c9?w=800&q=80"
                        alt="Umrah"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Overlays */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        {isDiyanet && (
                            <Badge className="bg-white/90 text-teal-700 hover:bg-white backdrop-blur-sm shadow-sm border-0">
                                <ShieldCheck className="w-3 h-3 mr-1" /> Diyanet Onaylı
                            </Badge>
                        )}
                        {listing.urgencyTag && (
                            <Badge variant="destructive" className="animate-pulse shadow-sm">
                                <Flame className="w-3 h-3 mr-1" /> {urgencyLabels[listing.urgencyTag] || listing.urgencyTag}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {listing.departureCity} Çıkışlı
                        </div>
                        <div className="flex items-center text-xs text-amber-500 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-100">
                            <Star className="w-3 h-3 mr-1 fill-amber-500" />
                            {listing.guide?.trustScore || 50} Güven Puanı
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">
                        {listing.title}
                    </h3>

                    <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600 gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{new Date(listing.startDate).toLocaleDateString('tr-TR')} - {listing.totalDays} Gün</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 gap-2">
                            <div className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">?</div>
                            <span className="truncate">Rehber: {listing.guide?.fullName}</span>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t flex items-end justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Başlayan fiyatlarla</p>
                            <div className={`text-xl font-bold ${accentColor}`}>
                                {minPrice} <span className="text-sm font-normal text-gray-500">SAR</span>
                            </div>
                        </div>
                        <Button size="sm" className={`${isDiyanet ? 'bg-teal-600 hover:bg-teal-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            İncele
                        </Button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
