import { fetchListing } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, MapPin, User, ArrowLeft } from 'lucide-react';

export default async function ListingPage({ params }: { params: { id: string } }) {
    const listing = await fetchListing(params.id);

    if (!listing) {
        return <div className="container py-20 text-center">İlan bulunamadı.</div>;
    }

    return (
        <div className="container py-8">
            <Link href="/search" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Arama sonuçlarına dön
            </Link>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">{listing.title.rendered}</h1>
                        <div className="flex items-center text-muted-foreground space-x-4">
                            <span className="flex items-center"><MapPin className="mr-1 h-4 w-4" /> {listing.meta?._location || 'Lokasyon'}</span>
                            <span className="flex items-center"><Calendar className="mr-1 h-4 w-4" /> Yakında</span>
                        </div>
                    </div>

                    {/* Gallery Placeholder */}
                    <div className="aspect-video w-full bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                        Görsel Galerisi
                    </div>

                    <div className="prose max-w-none">
                        <h3 className="text-xl font-semibold mb-4">Tur Hakkında</h3>
                        <div dangerouslySetInnerHTML={{ __html: listing.content.rendered }} />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="md:col-span-1">
                    <div className="sticky top-20 border rounded-lg p-6 shadow-sm bg-card">
                        <div className="mb-6">
                            <div className="text-sm text-muted-foreground">Kişi Başı</div>
                            <div className="text-3xl font-bold text-primary">{listing.formatted_price}</div>
                        </div>

                        <div className="space-y-4">
                            <Button className="w-full" size="lg">Rezervasyon Yap</Button>
                            <Button variant="outline" className="w-full">Organizatöre Soru Sor</Button>
                        </div>

                        <div className="mt-8 pt-6 border-t">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                    <User className="h-6 w-6 text-slate-500" />
                                </div>
                                <div>
                                    <div className="font-medium">Organizatör</div>
                                    <Link href="#" className="text-sm text-primary hover:underline">Profilini Gör</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
