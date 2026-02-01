import { prisma } from '../../lib/prisma.js';
import type { CreateAlertInput, UpdateAlertInput } from './alerts.schemas.js';

const FREQUENCY_MS: Record<string, number> = {
  HOURS_1: 1 * 60 * 60 * 1000,
  HOURS_3: 3 * 60 * 60 * 1000,
  HOURS_6: 6 * 60 * 60 * 1000,
  HOURS_12: 12 * 60 * 60 * 1000,
  HOURS_24: 24 * 60 * 60 * 1000,
};

const ALERT_INCLUDE = {
  _count: { select: { priceRecords: true } },
  priceRecords: {
    orderBy: { price: 'asc' as const },
    take: 1,
    select: { price: true },
  },
};

function serializeAlert(alert: any) {
  const { priceRecords, _count, ...rest } = alert;
  return {
    ...rest,
    priceThreshold: Number(rest.priceThreshold),
    lowestPrice:
      priceRecords?.[0]?.price != null
        ? Number(priceRecords[0].price)
        : null,
    priceRecordCount: _count?.priceRecords ?? 0,
  };
}

export async function createAlert(userId: string, input: CreateAlertInput) {
  const alert = await prisma.flightAlert.create({
    data: {
      userId,
      departureCity: input.departureCity,
      departureAirportCode: input.departureAirportCode,
      destinationCity: input.destinationCity,
      destinationAirportCode: input.destinationAirportCode,
      tripType: input.tripType,
      departureDate: new Date(input.departureDate),
      departureDateEnd: input.departureDateEnd
        ? new Date(input.departureDateEnd)
        : null,
      departureDayShift: input.departureDayShift,
      returnDate: input.returnDate ? new Date(input.returnDate) : null,
      returnDateEnd: input.returnDateEnd
        ? new Date(input.returnDateEnd)
        : null,
      returnDayShift: input.returnDayShift,
      priceThreshold: input.priceThreshold,
      airlines: input.airlines,
      maxFlightDuration: input.maxFlightDuration ?? null,
      checkFrequency: input.checkFrequency,
      nextCheckAt: new Date(),
    },
    include: ALERT_INCLUDE,
  });

  return serializeAlert(alert);
}

export async function listAlerts(userId: string, status?: string) {
  const alerts = await prisma.flightAlert.findMany({
    where: {
      userId,
      status: status ? (status as any) : { not: 'DELETED' as any },
    },
    include: ALERT_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  return alerts.map(serializeAlert);
}

export async function getAlert(userId: string, alertId: string) {
  const alert = await prisma.flightAlert.findUnique({
    where: { id: alertId },
    include: ALERT_INCLUDE,
  });

  if (!alert || alert.userId !== userId || alert.status === 'DELETED') {
    return null;
  }

  return serializeAlert(alert);
}

export async function updateAlert(
  userId: string,
  alertId: string,
  input: UpdateAlertInput,
) {
  const existing = await prisma.flightAlert.findUnique({
    where: { id: alertId },
  });

  if (!existing || existing.userId !== userId || existing.status === 'DELETED') {
    return null;
  }

  const data: Record<string, unknown> = {};

  if (input.departureCity !== undefined)
    data.departureCity = input.departureCity;
  if (input.departureAirportCode !== undefined)
    data.departureAirportCode = input.departureAirportCode;
  if (input.destinationCity !== undefined)
    data.destinationCity = input.destinationCity;
  if (input.destinationAirportCode !== undefined)
    data.destinationAirportCode = input.destinationAirportCode;
  if (input.tripType !== undefined) data.tripType = input.tripType;
  if (input.departureDate !== undefined)
    data.departureDate = new Date(input.departureDate);
  if (input.departureDateEnd !== undefined)
    data.departureDateEnd = input.departureDateEnd
      ? new Date(input.departureDateEnd)
      : null;
  if (input.departureDayShift !== undefined)
    data.departureDayShift = input.departureDayShift;
  if (input.returnDate !== undefined)
    data.returnDate = input.returnDate ? new Date(input.returnDate) : null;
  if (input.returnDateEnd !== undefined)
    data.returnDateEnd = input.returnDateEnd
      ? new Date(input.returnDateEnd)
      : null;
  if (input.returnDayShift !== undefined)
    data.returnDayShift = input.returnDayShift;
  if (input.priceThreshold !== undefined)
    data.priceThreshold = input.priceThreshold;
  if (input.airlines !== undefined) data.airlines = input.airlines;
  if (input.maxFlightDuration !== undefined)
    data.maxFlightDuration = input.maxFlightDuration;
  if (input.checkFrequency !== undefined) {
    data.checkFrequency = input.checkFrequency;
    data.nextCheckAt = new Date(
      Date.now() + FREQUENCY_MS[input.checkFrequency],
    );
  }

  const alert = await prisma.flightAlert.update({
    where: { id: alertId },
    data,
    include: ALERT_INCLUDE,
  });

  return serializeAlert(alert);
}

export async function deleteAlert(userId: string, alertId: string) {
  const existing = await prisma.flightAlert.findUnique({
    where: { id: alertId },
  });

  if (!existing || existing.userId !== userId || existing.status === 'DELETED') {
    return null;
  }

  await prisma.flightAlert.update({
    where: { id: alertId },
    data: { status: 'DELETED', nextCheckAt: null },
  });

  return true;
}

export async function pauseAlert(userId: string, alertId: string) {
  const existing = await prisma.flightAlert.findUnique({
    where: { id: alertId },
  });

  if (!existing || existing.userId !== userId || existing.status !== 'ACTIVE') {
    return null;
  }

  const alert = await prisma.flightAlert.update({
    where: { id: alertId },
    data: { status: 'PAUSED', nextCheckAt: null },
    include: ALERT_INCLUDE,
  });

  return serializeAlert(alert);
}

export async function resumeAlert(userId: string, alertId: string) {
  const existing = await prisma.flightAlert.findUnique({
    where: { id: alertId },
  });

  if (!existing || existing.userId !== userId || existing.status !== 'PAUSED') {
    return null;
  }

  const alert = await prisma.flightAlert.update({
    where: { id: alertId },
    data: { status: 'ACTIVE', nextCheckAt: new Date() },
    include: ALERT_INCLUDE,
  });

  return serializeAlert(alert);
}
