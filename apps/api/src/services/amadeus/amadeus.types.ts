// ── Amadeus OAuth2 ──────────────────────────────────────────────────

export interface AmadeusTokenResponse {
  type: string;
  username: string;
  application_name: string;
  client_id: string;
  token_type: string;
  access_token: string;
  expires_in: number;
  state: string;
}

// ── Flight Offers Search v2 ─────────────────────────────────────────

export interface AmadeusFlightOffersResponse {
  meta: { count: number };
  data: AmadeusFlightOffer[];
  dictionaries?: {
    carriers?: Record<string, string>;
  };
}

export interface AmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  lastTicketingDate?: string;
  numberOfBookableSeats?: number;
  itineraries: AmadeusItinerary[];
  price: AmadeusPrice;
  travelerPricings?: AmadeusTravelerPricing[];
}

export interface AmadeusItinerary {
  duration: string; // ISO 8601: "PT6H10M"
  segments: AmadeusSegment[];
}

export interface AmadeusSegment {
  departure: {
    iataCode: string;
    terminal?: string;
    at: string; // ISO datetime
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  carrierCode: string;
  number: string;
  aircraft?: { code: string };
  operating?: { carrierCode: string };
  duration: string;
  id: string;
  numberOfStops: number;
}

export interface AmadeusPrice {
  currency: string;
  total: string;
  base: string;
  grandTotal: string;
  fees?: Array<{ amount: string; type: string }>;
}

export interface AmadeusTravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: AmadeusPrice;
  fareDetailsBySegment: Array<{
    segmentId: string;
    cabin?: string;
    class?: string;
  }>;
}

// ── Airport & City Search v1 ────────────────────────────────────────

export interface AmadeusLocationResponse {
  meta: { count: number };
  data: AmadeusLocation[];
}

export interface AmadeusLocation {
  type: string;
  subType: string;
  name: string;
  detailedName?: string;
  id: string;
  iataCode: string;
  address: {
    cityName: string;
    cityCode?: string;
    countryName: string;
    countryCode: string;
    regionCode?: string;
  };
  geoCode?: {
    latitude: number;
    longitude: number;
  };
}

// ── Normalized app-level types ──────────────────────────────────────

export interface NormalizedFlightOffer {
  price: number;
  currency: string;
  airline: string;
  airlineName: string | null;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  duration: number; // minutes
  stops: number;
  returnDepartureTime: string | null;
  returnArrivalTime: string | null;
  returnDuration: number | null;
  returnStops: number | null;
}

export interface NormalizedAirport {
  name: string;
  iataCode: string;
  cityName: string;
  countryCode: string;
}
