import { Job } from 'bullmq';
import { prisma } from '../lib/prisma.js';
import { searchFlights } from '../services/amadeus/index.js';
import { incrementAndCheck } from '../services/amadeus/amadeus.rate-limiter.js';
import type { NormalizedFlightOffer } from '../services/amadeus/index.js';

export interface PriceCheckJobData {
  alertId: string;
}

const FREQUENCY_MS: Record<string, number> = {
  HOURS_1: 1 * 60 * 60 * 1000,
  HOURS_3: 3 * 60 * 60 * 1000,
  HOURS_6: 6 * 60 * 60 * 1000,
  HOURS_12: 12 * 60 * 60 * 1000,
  HOURS_24: 24 * 60 * 60 * 1000,
};

/** Map DayShift enum to the hour range [startHour, endHour). */
const DAY_SHIFT_HOURS: Record<string, [number, number]> = {
  MORNING: [5, 12],
  AFTERNOON: [12, 18],
  NIGHT: [18, 29], // 18:00 - 05:00 next day (29 = 24+5)
};

function departureHourMatchesShifts(
  departureTime: string,
  shifts: string[],
): boolean {
  if (shifts.length === 0) return true;
  const hour = new Date(departureTime).getUTCHours();

  return shifts.some((shift) => {
    const range = DAY_SHIFT_HOURS[shift];
    if (!range) return true;
    const [start, end] = range;
    if (end > 24) {
      // Night wraps around midnight: 18-24 OR 0-5
      return hour >= start || hour < end - 24;
    }
    return hour >= start && hour < end;
  });
}

function filterOffers(
  offers: NormalizedFlightOffer[],
  alert: {
    departureDayShift: string[];
    returnDayShift: string[];
    airlines: string[];
    maxFlightDuration: number | null;
    tripType: string;
  },
): NormalizedFlightOffer[] {
  return offers.filter((offer) => {
    // Filter by departure day shift
    if (!departureHourMatchesShifts(offer.departureTime, alert.departureDayShift)) {
      return false;
    }

    // Filter by return day shift (round trips only)
    if (
      alert.tripType === 'ROUND_TRIP' &&
      offer.returnDepartureTime &&
      !departureHourMatchesShifts(offer.returnDepartureTime, alert.returnDayShift)
    ) {
      return false;
    }

    // Filter by airlines (empty = any)
    if (
      alert.airlines.length > 0 &&
      !alert.airlines.includes(offer.airline)
    ) {
      return false;
    }

    // Filter by max flight duration (outbound only)
    if (alert.maxFlightDuration && offer.duration > alert.maxFlightDuration) {
      return false;
    }

    return true;
  });
}

export async function processPriceCheck(job: Job<PriceCheckJobData>) {
  const { alertId } = job.data;

  // 1. Fetch alert (skip if deleted/paused since enqueue)
  const alert = await prisma.flightAlert.findUnique({
    where: { id: alertId },
  });

  if (!alert || alert.status !== 'ACTIVE') {
    return { skipped: true, reason: 'alert not active' };
  }

  // 2. Build search params
  const departureDate = alert.departureDate.toISOString().split('T')[0];
  const returnDate = alert.returnDate
    ? alert.returnDate.toISOString().split('T')[0]
    : undefined;

  // 3. Check rate limit before calling Amadeus
  const rateCheck = await incrementAndCheck();
  if (!rateCheck.allowed) {
    const nextCheckAt = new Date(
      Date.now() + (FREQUENCY_MS[alert.checkFrequency] ?? FREQUENCY_MS.HOURS_6),
    );
    await prisma.flightAlert.update({
      where: { id: alertId },
      data: { nextCheckAt },
    });
    return {
      alertId,
      skipped: true,
      reason: `Monthly API limit exceeded (${rateCheck.current}/${rateCheck.limit})`,
    };
  }

  // 4. Call Amadeus (gracefully handle API errors)
  let offers: NormalizedFlightOffer[];
  try {
    offers = await searchFlights({
      originLocationCode: alert.departureAirportCode!,
      destinationLocationCode: alert.destinationAirportCode!,
      departureDate,
      returnDate,
    });
  } catch (err) {
    // Amadeus error (unsupported route, rate limit, etc.)
    // Update scheduling so we don't retry immediately, then re-throw
    // only for transient errors (5xx). For client errors (4xx), just skip.
    const message = err instanceof Error ? err.message : String(err);
    const is4xx = /\(4\d{2}\)/.test(message);

    const nextCheckAt = new Date(
      Date.now() + (FREQUENCY_MS[alert.checkFrequency] ?? FREQUENCY_MS.HOURS_6),
    );
    await prisma.flightAlert.update({
      where: { id: alertId },
      data: { lastCheckedAt: new Date(), nextCheckAt },
    });

    if (is4xx) {
      // Client error — don't retry (bad route, past date, etc.)
      return { alertId, error: message, skipped: true };
    }
    throw err; // 5xx or network errors — let BullMQ retry
  }

  // 4. Filter results
  const filtered = filterOffers(offers, {
    departureDayShift: alert.departureDayShift,
    returnDayShift: alert.returnDayShift,
    airlines: alert.airlines,
    maxFlightDuration: alert.maxFlightDuration,
    tripType: alert.tripType,
  });

  // 5. Store matching results as PriceRecords
  if (filtered.length > 0) {
    await prisma.priceRecord.createMany({
      data: filtered.map((offer) => ({
        alertId,
        price: offer.price,
        currency: offer.currency,
        airline: offer.airline,
        flightNumber: offer.flightNumber,
        departureTime: new Date(offer.departureTime),
        arrivalTime: new Date(offer.arrivalTime),
        duration: offer.duration,
        stops: offer.stops,
        bookingLink: null,
      })),
    });
  }

  // 6. Update alert scheduling
  const nextCheckAt = new Date(
    Date.now() + (FREQUENCY_MS[alert.checkFrequency] ?? FREQUENCY_MS.HOURS_6),
  );

  await prisma.flightAlert.update({
    where: { id: alertId },
    data: {
      lastCheckedAt: new Date(),
      nextCheckAt,
    },
  });

  return {
    alertId,
    offersFound: offers.length,
    offersStored: filtered.length,
  };
}
