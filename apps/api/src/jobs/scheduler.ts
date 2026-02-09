import { Job } from 'bullmq';
import { prisma } from '../lib/prisma.js';
import { priceCheckQueue } from './queue.js';

export async function processScheduler(_job: Job) {
  // Find all active alerts that are due for checking
  const dueAlerts = await prisma.flightAlert.findMany({
    where: {
      status: 'ACTIVE',
      nextCheckAt: { lte: new Date() },
    },
    select: { id: true },
  });

  if (dueAlerts.length === 0) {
    return { enqueued: 0 };
  }

  // Enqueue individual price-check jobs (jobId = alertId for deduplication)
  for (const alert of dueAlerts) {
    await priceCheckQueue.add(
      'check',
      { alertId: alert.id },
      { jobId: alert.id },
    );
  }

  return { enqueued: dueAlerts.length };
}
