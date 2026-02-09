import { env } from '../../lib/env.js';
import type {
  AmadeusTokenResponse,
  AmadeusFlightOffersResponse,
  AmadeusLocationResponse,
} from './amadeus.types.js';

const BASE_URL = 'https://test.api.amadeus.com';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const res = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.AMADEUS_API_KEY,
      client_secret: env.AMADEUS_API_SECRET,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus OAuth2 failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as AmadeusTokenResponse;
  cachedToken = data.access_token;
  // Refresh 60s before actual expiry
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;

  return cachedToken;
}

async function amadeusRequest<T>(
  path: string,
  params?: Record<string, string>,
  retry = true,
): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Single retry on 401 (token invalidated server-side)
  if (res.status === 401 && retry) {
    cachedToken = null;
    tokenExpiresAt = 0;
    return amadeusRequest<T>(path, params, false);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus API error (${res.status}): ${text}`);
  }

  return (await res.json()) as T;
}

export interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;
  adults?: string;
  max?: string;
  currencyCode?: string;
}

export async function fetchFlightOffers(
  params: FlightSearchParams,
): Promise<AmadeusFlightOffersResponse> {
  return amadeusRequest<AmadeusFlightOffersResponse>(
    '/v2/shopping/flight-offers',
    {
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate,
      ...(params.returnDate && { returnDate: params.returnDate }),
      adults: params.adults ?? '1',
      max: params.max ?? '50',
      currencyCode: params.currencyCode ?? 'BRL',
    },
  );
}

export async function fetchAirportSearch(
  keyword: string,
): Promise<AmadeusLocationResponse> {
  return amadeusRequest<AmadeusLocationResponse>(
    '/v1/reference-data/locations',
    {
      subType: 'AIRPORT,CITY',
      keyword,
      'page[limit]': '10',
      view: 'FULL',
    },
  );
}
