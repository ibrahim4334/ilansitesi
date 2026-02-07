import type { Tour, TourListItem, ToursResponse, TourFilters, City } from './types';

const WP_API_URL = process.env.NEXT_PUBLIC_WP_API_URL || "";

// Check if we have a valid API URL (not empty, not placeholder, not dummy)
const hasValidApiUrl = Boolean(
  WP_API_URL && 
  WP_API_URL.length > 0 && 
  !WP_API_URL.includes("dummyjson") &&
  !WP_API_URL.includes("dummy") &&
  !WP_API_URL.includes("placeholder") &&
  WP_API_URL.startsWith("http")
);

// Mock data for demo purposes
const mockTours: TourListItem[] = [
  {
    id: 1,
    slug: "ramazan-umresi-2025",
    title: "Ramazan Umresi 2025",
    thumbnail: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&h=600&fit=crop",
    price: 52000,
    duration: "10 Gün / 9 Gece",
    departureCity: "İstanbul",
    rating: 4.9,
    reviewCount: 124,
    agencyName: "Hicaz Turizm",
    featured: true,
  },
  {
    id: 2,
    slug: "ekonomik-umre-paketi",
    title: "Ekonomik Umre Paketi",
    thumbnail: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&h=600&fit=crop",
    price: 38500,
    duration: "7 Gün / 6 Gece",
    departureCity: "Ankara",
    rating: 4.7,
    reviewCount: 89,
    agencyName: "Sefa Turizm",
    featured: true,
  },
  {
    id: 3,
    slug: "luks-umre-turu",
    title: "Lüks Umre Turu - 5 Yıldız",
    thumbnail: "https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?w=800&h=600&fit=crop",
    price: 75000,
    duration: "12 Gün / 11 Gece",
    departureCity: "İstanbul",
    rating: 5.0,
    reviewCount: 67,
    agencyName: "Zemzem Travel",
    featured: true,
  },
  {
    id: 4,
    slug: "aile-umre-paketi",
    title: "Aile Umre Paketi",
    thumbnail: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800&h=600&fit=crop",
    price: 45000,
    duration: "10 Gün / 9 Gece",
    departureCity: "İzmir",
    rating: 4.8,
    reviewCount: 156,
    agencyName: "Medine Turizm",
    featured: true,
  },
  {
    id: 5,
    slug: "kurban-bayrami-umresi",
    title: "Kurban Bayramı Umresi",
    thumbnail: "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&h=600&fit=crop",
    price: 62000,
    duration: "14 Gün / 13 Gece",
    departureCity: "İstanbul",
    rating: 4.6,
    reviewCount: 43,
    agencyName: "Hicaz Turizm",
    featured: true,
  },
  {
    id: 6,
    slug: "yaz-umresi-2025",
    title: "Yaz Umresi 2025",
    thumbnail: "https://images.unsplash.com/photo-1537031934600-008e8de5a7d8?w=800&h=600&fit=crop",
    price: 41000,
    duration: "8 Gün / 7 Gece",
    departureCity: "Bursa",
    rating: 4.5,
    reviewCount: 78,
    agencyName: "Sefa Turizm",
    featured: false,
  },
];

const mockTourDetails: Record<string, Tour> = {
  "ramazan-umresi-2025": {
    id: 1,
    slug: "ramazan-umresi-2025",
    title: "Ramazan Umresi 2025",
    description: "Ramazan ayının maneviyatını Mekke ve Medine'de yaşayın. Diyanet onaylı rehberlerimiz eşliğinde unutulmaz bir ibadet deneyimi sizi bekliyor.",
    price: 52000,
    duration: "10 Gün / 9 Gece",
    departureCity: "İstanbul",
    rating: 4.9,
    reviewCount: 124,
    agencyName: "Hicaz Turizm",
    agencyPhone: "+90 212 555 1234",
    agencyEmail: "info@hicazturizm.com",
    images: [
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?w=1200&h=800&fit=crop",
    ],
    included: ["Uçak bileti", "Otel konaklaması", "Vize işlemleri", "Transfer hizmetleri", "Rehberlik hizmeti", "Sabah kahvaltısı"],
    excluded: ["Öğle ve akşam yemekleri", "Kişisel harcamalar", "Seyahat sigortası"],
    itinerary: [
      { day: 1, title: "İstanbul - Cidde", description: "Atatürk Havalimanı'ndan kalkış, Cidde'ye varış ve Mekke'ye transfer." },
      { day: 2, title: "Mekke - Umre", description: "Umre ibadetinin ifası, Kabe'de tavaf ve sa'y." },
      { day: 3, title: "Mekke", description: "Serbest zaman, nafile tavaf ve ibadet." },
      { day: 4, title: "Mekke", description: "Mekke gezisi, tarihi mekanların ziyareti." },
      { day: 5, title: "Mekke - Medine", description: "Medine'ye otobüsle yolculuk." },
      { day: 6, title: "Medine", description: "Mescid-i Nebevi ziyareti, Ravza-i Mutahhara." },
      { day: 7, title: "Medine", description: "Uhud Dağı, Kuba Mescidi ve tarihi mekanlar gezisi." },
      { day: 8, title: "Medine", description: "Serbest zaman, ibadet ve alışveriş." },
      { day: 9, title: "Medine - Cidde", description: "Cidde'ye transfer ve serbest zaman." },
      { day: 10, title: "Cidde - İstanbul", description: "Cidde'den İstanbul'a dönüş." },
    ],
    hotels: [
      { name: "Mekke Hilton Towers", city: "Mekke", stars: 5, distanceToHaram: "200m" },
      { name: "Medine Anwar Al Madinah", city: "Medine", stars: 5, distanceToHaram: "150m" },
    ],
    emergencyContacts: [
      { name: "Tur Rehberi - Ahmet Yılmaz", phone: "+90 532 555 1234" },
      { name: "Acente 7/24 Destek", phone: "+90 212 555 1234" },
      { name: "Türk Konsolosluğu Cidde", phone: "+966 12 664 5700" },
    ],
  },
};

const mockCities: City[] = [
  { id: 1, name: "İstanbul", slug: "istanbul" },
  { id: 2, name: "Ankara", slug: "ankara" },
  { id: 3, name: "İzmir", slug: "izmir" },
  { id: 4, name: "Bursa", slug: "bursa" },
  { id: 5, name: "Antalya", slug: "antalya" },
];

// Check if we should use mock data
const useMockData = !hasValidApiUrl;

// Helper function for fetching data
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (!hasValidApiUrl) {
    throw new Error("WP_API_URL not configured");
  }
  
  const url = `${WP_API_URL}${endpoint}`;
  
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`fetch to ${url} failed with status ${res.status} and body: ${await res.text()}`);
  }

  return res.json();
}

// Get all tours with optional filters
export async function getTours(filters?: TourFilters): Promise<ToursResponse> {
  if (useMockData) {
    let filteredTours = [...mockTours];
    
    if (filters?.city) {
      filteredTours = filteredTours.filter(t => t.departureCity.toLowerCase() === filters.city?.toLowerCase());
    }
    if (filters?.minPrice !== undefined) {
      filteredTours = filteredTours.filter(t => t.price >= (filters.minPrice || 0));
    }
    if (filters?.maxPrice !== undefined) {
      filteredTours = filteredTours.filter(t => t.price <= (filters.maxPrice || Infinity));
    }
    
    const page = filters?.page || 1;
    const perPage = filters?.perPage || 9;
    const start = (page - 1) * perPage;
    const paginatedTours = filteredTours.slice(start, start + perPage);
    
    return {
      tours: paginatedTours,
      total: filteredTours.length,
      totalPages: Math.ceil(filteredTours.length / perPage),
    };
  }

  const params = new URLSearchParams();
  
  if (filters?.city) {
    params.append('departure_city', filters.city);
  }
  if (filters?.minPrice !== undefined) {
    params.append('min_price', filters.minPrice.toString());
  }
  if (filters?.maxPrice !== undefined) {
    params.append('max_price', filters.maxPrice.toString());
  }
  if (filters?.page) {
    params.append('page', filters.page.toString());
  }
  if (filters?.perPage) {
    params.append('per_page', filters.perPage.toString());
  }

  const queryString = params.toString();
  const endpoint = `/listings${queryString ? `?${queryString}` : ''}`;
  
  const data = await fetchAPI<{ listings: TourListItem[]; total: number; total_pages: number }>(endpoint);
  
  return {
    tours: data.listings || [],
    total: data.total || 0,
    totalPages: data.total_pages || 1,
  };
}

// Get featured tours for landing page
export async function getFeaturedTours(): Promise<TourListItem[]> {
  if (useMockData) {
    return mockTours.filter(t => t.featured).slice(0, 6);
  }
  
  const data = await fetchAPI<{ listings: TourListItem[] }>('/listings?featured=true&per_page=6');
  return data.listings || [];
}

// Get a single tour by slug
export async function getTourBySlug(slug: string): Promise<Tour | null> {
  if (useMockData) {
    // Return mock detail if available, otherwise construct from list item
    if (mockTourDetails[slug]) {
      return mockTourDetails[slug];
    }
    const listItem = mockTours.find(t => t.slug === slug);
    if (listItem) {
      return {
        ...listItem,
        description: "Bu tur hakkında detaylı bilgi için acente ile iletişime geçin.",
        images: [listItem.thumbnail],
        included: ["Uçak bileti", "Otel konaklaması", "Vize işlemleri", "Transfer"],
        excluded: ["Kişisel harcamalar"],
        itinerary: [
          { day: 1, title: "Kalkış", description: "Havalimanından kalkış" },
          { day: 2, title: "Varış", description: "Kutsal topraklara varış" },
        ],
        hotels: [
          { name: "Otel bilgisi için acente ile iletişime geçin", city: "Mekke", stars: 4 },
        ],
        emergencyContacts: [
          { name: "Acente İletişim", phone: "+90 212 555 0000" },
        ],
        agencyPhone: "+90 212 555 0000",
        agencyEmail: "info@acente.com",
      };
    }
    return null;
  }

  try {
    const data = await fetchAPI<Tour[]>(`/listings?slug=${slug}`);
    return data[0] || null;
  } catch {
    return null;
  }
}

// Get a single tour by ID
export async function getTourById(id: number): Promise<Tour | null> {
  if (useMockData) {
    const tour = mockTours.find(t => t.id === id);
    if (tour) {
      return getTourBySlug(tour.slug);
    }
    return null;
  }

  try {
    const data = await fetchAPI<Tour>(`/listings/${id}`);
    return data;
  } catch {
    return null;
  }
}

// Get all available cities for filtering
export async function getCities(): Promise<City[]> {
  if (useMockData) {
    return mockCities;
  }
  
  const data = await fetchAPI<City[]>('/listings/cities');
  return data || [];
}

// Get offline export URL for a tour
export function getOfflineExportUrl(listingId: number): string {
  if (useMockData) {
    return `#offline-export-${listingId}`;
  }
  const baseUrl = WP_API_URL?.replace('/wp-json/wp/v2', '') || '';
  return `${baseUrl}/wp-admin/admin-ajax.php?action=ute_export_tour&listing_id=${listingId}`;
}

// Get price range for filters
export async function getPriceRange(): Promise<{ min: number; max: number }> {
  if (useMockData) {
    const prices = mockTours.map(t => t.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  try {
    const data = await fetchAPI<{ min: number; max: number }>('/listings/price-range');
    return data;
  } catch {
    return { min: 0, max: 100000 };
  }
}
