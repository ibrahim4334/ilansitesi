import { db } from "@/lib/db";
import { PackageSystem } from "@/lib/package-system";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Check, ShieldCheck, Star, Phone, MessageCircle, Info } from "lucide-react";
import { notFound } from "next/navigation";

// Helper to get listing with guide info
async function getListing(id: string) {
    const database = db.read();
    const listing = database.guideListings.find((l) => l.id === id);

    if (!listing) return null;

    const guide = database.guideProfiles.find((p) => p.userId === listing.guideId);
    const showPhone = guide ? PackageSystem.isPhoneVisible(guide) : false;

    return {
        ...listing,
        guide: guide ? {
            ...guide,
            phone: showPhone ? guide.phone : null,
            package: guide.package || "FREEMIUM",
        } : null
    };
}

export default async function ListingPage({ params }: { params: { id: string } }) {
    const listing = await getListing(params.id);

    if (!listing) {
        notFound();
    }

    const isDiyanet = listing.guide?.isDiyanet;
    const isPremium = listing.guide?.package !== 'FREEMIUM';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Image */}
            <div className="relative h-[400px] w-full">
                <img
                    src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1920&q=80"
                    alt={listing.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-6 left-0 w-full px-4">
                    <div className="container mx-auto">
                        <Link href="/" className="inline-flex items-center text-white/90 hover:text-white transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Listeye Dön
                        </Link>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10">
                    <div className="container mx-auto">
                        <div className="flex flex-wrap gap-3 mb-4">
                            {isDiyanet && (
                                <Badge className="bg-teal-500 hover:bg-teal-600 border-none text-white px-3 py-1 text-base">
                                    <ShieldCheck className="w-4 h-4 mr-2" /> Diyanet Onaylı
                                </Badge>
                            )}
                            <Badge variant="secondary" className="bg-white/90 text-gray-900 px-3 py-1 text-base backdrop-blur-md">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(listing.startDate).toLocaleDateString('tr-TR')} - {listing.totalDays} Gün
                            </Badge>
                            <Badge variant="secondary" className="bg-white/90 text-gray-900 px-3 py-1 text-base backdrop-blur-md">
                                <MapPin className="w-4 h-4 mr-2" />
                                {listing.departureCity} Çıkışlı
                            </Badge>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
                            {listing.title}
                        </h1>
                        <div className="flex items-center text-white/80 gap-2">
                            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                            <span className="font-semibold text-white">{listing.guide?.trustScore || 50} Güven Puanı</span>
                            <span className="mx-2">•</span>
                            <span>{listing.airline || "THY"} ile uçuş</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Overview Card */}
                        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Tur Özeti</h2>
                                <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                                    {listing.description}
                                </p>
                            </div>

                            {/* Pricing Grid */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Fiyatlandırma (Kişi Başı)</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-4 border text-center">
                                        <div className="text-gray-500 text-sm mb-1">4 Kişilik Oda</div>
                                        <div className="text-xl font-bold text-gray-900">{listing.pricing?.quad || '-'} SAR</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 border text-center">
                                        <div className="text-gray-500 text-sm mb-1">3 Kişilik Oda</div>
                                        <div className="text-xl font-bold text-gray-900">{listing.pricing?.triple || '-'} SAR</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 border text-center">
                                        <div className="text-gray-500 text-sm mb-1">2 Kişilik Oda</div>
                                        <div className="text-xl font-bold text-gray-900">{listing.pricing?.double || '-'} SAR</div>
                                    </div>
                                </div>
                            </div>

                            {/* Extra Services */}
                            {listing.extraServices && listing.extraServices.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Dahil Hizmetler</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {listing.extraServices.map((service: string) => (
                                            <div key={service} className="flex items-center gap-2 text-gray-700">
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                <span>{service}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tour Plan */}
                        {listing.tourPlan && listing.tourPlan.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Tur Programı</h2>
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                    {listing.tourPlan.map((day: any, i: number) => (
                                        <div key={i} className="relative flex gap-6 items-start">
                                            <div className="absolute left-0 top-1 mt-0.5 ml-2.5 -translate-x-1/2 rounded-full border border-white bg-slate-100 p-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-500 ring-2 ring-white" />
                                            </div>
                                            <div className="flex-none w-16 pt-1 font-bold text-gray-500 text-right">
                                                {day.day}. Gün
                                            </div>
                                            <div className="flex-grow pt-1 pb-4">
                                                <h4 className="font-semibold text-gray-900 mb-1">{day.city}</h4>
                                                <p className="text-gray-600 text-sm">{day.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">

                        {/* Guide Card (Premium Only / Partial) */}
                        <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm">
                                    {listing.guide?.photo ? (
                                        <img src={listing.guide.photo} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <UserIcon className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{listing.guide?.fullName}</h3>
                                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit mt-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        Aktif Rehber
                                    </div>
                                </div>
                            </div>

                            {isPremium ? (
                                <div className="space-y-4">
                                    {listing.guide?.bio && (
                                        <p className="text-sm text-gray-600 leading-relaxed border-b pb-4">
                                            {listing.guide.bio}
                                        </p>
                                    )}

                                    <div className="space-y-3">
                                        {listing.guide?.phone && (
                                            <>
                                                <Button className="w-full bg-green-600 hover:bg-green-700 gap-2" asChild>
                                                    <a href={`https://wa.me/${listing.guide.phone.replace(/\+/g, '').replace(/\s/g, '')}`} target="_blank">
                                                        <MessageCircle className="w-4 h-4" /> WhatsApp
                                                    </a>
                                                </Button>
                                                <Button variant="outline" className="w-full gap-2" asChild>
                                                    <a href={`tel:${listing.guide.phone}`}>
                                                        <Phone className="w-4 h-4" /> Ara
                                                    </a>
                                                </Button>
                                            </>
                                        )}
                                        {/* PDF Download - Premium Feature */}
                                        <Button variant="secondary" className="w-full gap-2 border" asChild>
                                            <a href={`/api/listings/pdf?id=${listing.id}`} target="_blank" rel="noopener noreferrer">
                                                <Calendar className="w-4 h-4" /> Tur Programını İndir (PDF)
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-4 bg-gray-50 rounded-lg border border-dashed text-sm text-gray-500">
                                    <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p>Rehber iletişim bilgileri bu tur paketi için görüntülenemiyor.</p>
                                    <p className="mt-2 text-xs">Detaylar için platform üzerinden teklif isteyebilirsiniz.</p>
                                </div>
                            )}

                            <div className="mt-6 pt-6 border-t space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Kalan Kontenjan</span>
                                    <span className="font-bold text-gray-900">{listing.quota - listing.filled} / {listing.quota}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500" style={{ width: `${(listing.filled / listing.quota) * 100}%` }} />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

function UserIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}

