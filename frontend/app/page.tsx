import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'
import { fetchListings } from '@/lib/api'
import { Search } from 'lucide-react'

export default async function Home() {
    const listings = await fetchListings();

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="w-full py-12 md:py-24 lg:py-32 bg-slate-900 text-white">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                                En İyi Umre Turlarını Bulun
                            </h1>
                            <p className="mx-auto max-w-[700px] text-gray-300 md:text-xl">
                                Yüzlerce tur firması, binlerce seçenek. Sizin için en uygun umre paketini kolayca karşılaştırın ve bulun.
                            </p>
                        </div>
                        <div className="w-full max-w-sm space-y-2">
                            <form action="/search" className="flex space-x-2">
                                <Input name="q" className="max-w-lg flex-1 bg-white text-black" placeholder="Tur ara (örn: Ramazan, Ekonomik)..." type="search" />
                                <Button type="submit" variant="secondary">
                                    <Search className="h-4 w-4 mr-2" />
                                    Ara
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Listings */}
            <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
                <div className="container px-4 md:px-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold tracking-tight">Öne Çıkan Turlar</h2>
                        <Link href="/search" className="text-sm font-medium text-primary hover:underline">
                            Tümünü Gör
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map((listing) => (
                            <Card key={listing.id}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{listing.title.rendered}</CardTitle>
                                    <CardDescription>
                                        {listing.meta?._location || 'Lokasyon belirtilmemiş'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: listing.excerpt.rendered }} />
                                    <div className="mt-4 font-bold text-lg">{listing.formatted_price}</div>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <Link href={`/listings/${listing.id}`}>Detayları Gör</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
