import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { PriceHistoryQuery } from './prices.schemas.js';

function serializePriceRecord(record: any) {
  return {
    ...record,
    price: Number(record.price),
  };
}

async function checkAlertOwnership(userId: string, alertId: string) {
  const alert = await prisma.flightAlert.findUnique({
    where: { id: alertId },
    select: { userId: true, status: true },
  });

  if (!alert || alert.userId !== userId || alert.status === 'DELETED') {
    return null;
  }

  return alert;
}

export async function getPriceHistory(
  userId: string,
  alertId: string,
  query: PriceHistoryQuery,
) {
  if (!(await checkAlertOwnership(userId, alertId))) {
    return null;
  }

  const orderBy =
    query.sort === 'cheapest'
      ? { price: 'asc' as const }
      : { checkedAt: 'desc' as const };

  const [records, total] = await Promise.all([
    prisma.priceRecord.findMany({
      where: { alertId },
      orderBy,
      take: query.limit,
      skip: query.offset,
    }),
    prisma.priceRecord.count({ where: { alertId } }),
  ]);

  return {
    records: records.map(serializePriceRecord),
    total,
  };
}

export async function getDailyLowestPrices(userId: string, alertId: string) {
  if (!(await checkAlertOwnership(userId, alertId))) {
    return null;
  }

  const points = await prisma.$queryRaw<
    { date: Date; lowest_price: number }[]
  >(
    Prisma.sql`
      SELECT DATE("checkedAt") as date, MIN(price)::float as lowest_price
      FROM price_records
      WHERE "alertId" = ${alertId}
      GROUP BY DATE("checkedAt")
      ORDER BY date ASC
    `,
  );

  return {
    points: points.map((p) => ({
      date: p.date.toISOString().split('T')[0],
      lowestPrice: p.lowest_price,
    })),
  };
}
