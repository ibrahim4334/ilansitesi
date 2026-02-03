import { fetchListings } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default async function SearchPage({
    searchParams,
}: {
    searchParams: { q?: string };
}) {
    const query = searchParams.q || '';
    const listings = await fetchListings(query);

    return (
        <div className="container py-8 md:py-12">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filters (Mobile First: Top on mobile, Left on desktop) */}
                <aside className="w-full md:w-64 space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Filtrele</h3>
                        <form action="/search">
                            <div className="space-y-4">
                                <Input name="q" placeholder="Kelime ara..." defaultValue={query} />
                                {/* Add more filters here like Date, Price Range, etc */}
                                <Button type="submit" className="w-full">Uygula</Button>
                            </div>
                        </form>
                    </div>
                </aside>

                {/* Results */}
                <main className="flex-1">
                    <h1 className="text-2xl font-bold mb-6">
                        "{query}" için sonuçlar ({listings.length})
                    </h1>

                    <div className="space-y-4">
                        {listings.length === 0 ? (
                            <p className="text-muted-foreground">Sonuç bulunamadı.</p>
                        ) : (
                            listings.map((listing) => (
                                <Card key={listing.id} className="flex flex-col md:flex-row overflow-hidden">
                                    {/* Image Placeholder */}
                                    <div className="w-full md:w-48 bg-gray-200 h-48 md:h-auto flex-shrink-0"></div>

                                    <div className="flex-1 flex flex-col">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-xl">
                                                        <Link href={`/listings/${listing.id}`} className="hover:underline">
                                                            {listing.title.rendered}
                                                        </Link>
                                                    </CardTitle>
                                                    <CardDescription>{listing.meta?._location}</CardDescription>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-lg text-primary">{listing.formatted_price}</span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <div className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: listing.excerpt.rendered }} />
                                        </CardContent>
                                        <CardFooter>
                                            <Button size="sm" asChild>
                                                <Link href={`/listings/${listing.id}`}>İncele</Link>
                                            </Button>
                                        </CardFooter>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
