// WordPress API Types for Umrebuldum

export interface Hotel {
  name: string;
  stars: number;
  location: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface Tour {
  id: number;
  slug: string;
  title: string;
  featured_image: string;
  price: number;
  duration: string;
  departure_city: string;
  hotels: Hotel[];
  itinerary: ItineraryDay[];
  guide_name: string;
  guide_phone: string;
  agency_name: string;
}

export interface TourListItem {
  id: number;
  slug: string;
  title: string;
  featured_image: string;
  price: number;
  duration: string;
  departure_city: string;
}

export interface ToursResponse {
  tours: TourListItem[];
  total: number;
  totalPages: number;
}

export interface TourFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  perPage?: number;
}

export interface City {
  name: string;
  count: number;
}
