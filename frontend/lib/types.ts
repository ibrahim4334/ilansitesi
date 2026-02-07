// WordPress API Types for Umrebuldum

export interface Hotel {
  name: string;
  stars: number;
  location?: string;
  city?: string;
  distanceToHaram?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface Tour {
  id: number;
  slug: string;
  title: string;
  featured_image?: string;
  thumbnail?: string; // specific to legacy/mock
  price: number;
  duration: string;
  departure_city: string;
  departureCity?: string; // alias for legacy/mock
  hotels: Hotel[];
  itinerary: ItineraryDay[];
  guide_name?: string;
  guide_phone?: string;
  agency_name?: string;
  agencyName?: string; // alias
  agencyPhone?: string;
  agencyEmail?: string;
  images?: string[];
  included?: string[];
  excluded?: string[];
  emergencyContacts?: EmergencyContact[];
  rating?: number;
  reviewCount?: number;
  description?: string;
}

export interface TourListItem {
  id: number;
  slug: string;
  title: string;
  featured_image?: string;
  thumbnail?: string; // alias
  price: number;
  duration: string;
  departure_city: string;
  departureCity?: string; // alias
  rating?: number;
  reviewCount?: number;
  agencyName?: string;
  agency_name?: string;
  featured?: boolean;
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
  id?: number;
  name: string;
  slug?: string;
  count?: number;
}
