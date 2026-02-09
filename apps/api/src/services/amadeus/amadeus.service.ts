import {
  fetchFlightOffers,
  fetchAirportSearch,
  type FlightSearchParams,
} from './amadeus.client.js';
import type {
  AmadeusFlightOffer,
  NormalizedFlightOffer,
  NormalizedAirport,
} from './amadeus.types.js';

/**
 * Parse ISO 8601 duration (e.g. "PT2H30M") to minutes.
 */
export function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  return hours * 60 + minutes;
}

function normalizeOffer(
  offer: AmadeusFlightOffer,
  carriers: Record<string, string>,
): NormalizedFlightOffer {
  const outbound = offer.itineraries[0];
  const firstSeg = outbound.segments[0];
  const lastSeg = outbound.segments[outbound.segments.length - 1];

  const returnItinerary = offer.itineraries[1] ?? null;
  let returnDepartureTime: string | null = null;
  let returnArrivalTime: string | null = null;
  let returnDuration: number | null = null;
  let returnStops: number | null = null;

  if (returnItinerary) {
    const retFirst = returnItinerary.segments[0];
    const retLast =
      returnItinerary.segments[returnItinerary.segments.length - 1];
    returnDepartureTime = retFirst.departure.at;
    returnArrivalTime = retLast.arrival.at;
    returnDuration = parseDuration(returnItinerary.duration);
    returnStops = returnItinerary.segments.length - 1;
  }

  return {
    price: parseFloat(offer.price.grandTotal),
    currency: offer.price.currency,
    airline: firstSeg.carrierCode,
    airlineName: carriers[firstSeg.carrierCode] ?? null,
    flightNumber: `${firstSeg.carrierCode}${firstSeg.number}`,
    departureTime: firstSeg.departure.at,
    arrivalTime: lastSeg.arrival.at,
    departureAirport: firstSeg.departure.iataCode,
    arrivalAirport: lastSeg.arrival.iataCode,
    duration: parseDuration(outbound.duration),
    stops: outbound.segments.length - 1,
    returnDepartureTime,
    returnArrivalTime,
    returnDuration,
    returnStops,
  };
}

export interface SearchFlightsParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
}

export async function searchFlights(
  params: SearchFlightsParams,
): Promise<NormalizedFlightOffer[]> {
  const searchParams: FlightSearchParams = {
    originLocationCode: params.originLocationCode,
    destinationLocationCode: params.destinationLocationCode,
    departureDate: params.departureDate,
    ...(params.returnDate && { returnDate: params.returnDate }),
  };

  const response = await fetchFlightOffers(searchParams);
  const carriers = response.dictionaries?.carriers ?? {};

  return response.data.map((offer) => normalizeOffer(offer, carriers));
}

export async function searchAirports(
  keyword: string,
): Promise<NormalizedAirport[]> {
  const response = await fetchAirportSearch(keyword);

  return response.data.map((loc) => ({
    name: loc.name,
    iataCode: loc.iataCode,
    cityName: loc.address.cityName,
    countryCode: loc.address?.countryCode ?? '',
  }));
}
