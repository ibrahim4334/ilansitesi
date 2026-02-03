const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://umrebuldum.com/wp-json';

export interface Listing {
    id: number;
    title: { rendered: string };
    content: { rendered: string };
    excerpt: { rendered: string };
    meta?: {
        _price?: string;
        _date?: string;
        _location?: string;
    };
    formatted_price?: string;
}

export async function fetchListings(search: string = ''): Promise<Listing[]> {
    // In a real app, you'd fetch from your WordPress REST API or HivePress endpoint.
    // Example: `${API_URL}/hp/v1/listings?s=${search}`

    // For scaffolding purposes, we simulate an API call or fallback to mock data.
    // const res = await fetch(`${API_URL}/wp/v2/listings?search=${search}`);
    // if (!res.ok) throw new Error('Failed to fetch listings');
    // return res.json();

    // MOCK DATA for scaffolding
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockListings: Listing[] = [
        {
            id: 1,
            title: { rendered: 'Lüks Umre Turu - 15 Gün' },
            content: { rendered: '<p>Detaylı açıklama buraya gelir...</p>' },
            excerpt: { rendered: 'Mekke ve Medine de konforlu bir ibadet deneyimi.' },
            meta: { _price: '1500', _location: 'Mekke' },
            formatted_price: '1500 USD'
        },
        {
            id: 2,
            title: { rendered: 'Ekonomik Umre Paketi' },
            content: { rendered: '<p>Detaylı açıklama...</p>' },
            excerpt: { rendered: 'Bütçe dostu, maneviyat dolu bir yolculuk.' },
            meta: { _price: '900', _location: 'Medine' },
            formatted_price: '900 USD'
        },
        {
            id: 3,
            title: { rendered: 'Ramazan Umresi' },
            content: { rendered: '<p>Ramazan ayında özel...</p>' },
            excerpt: { rendered: 'Ramazan ayının bereketini kutsal topraklarda yaşayın.' },
            meta: { _price: '2000', _location: 'Mekke' },
            formatted_price: '2000 USD'
        }
    ];

    if (search) {
        return mockListings.filter(l => l.title.rendered.toLowerCase().includes(search.toLowerCase()));
    }

    return mockListings;
}

export async function fetchListing(id: string): Promise<Listing | null> {
    // const res = await fetch(`${API_URL}/wp/v2/listings/${id}`);
    // return res.json();

    // Mock
    const listeners = await fetchListings();
    return listeners.find(l => l.id.toString() === id) || null;
}
