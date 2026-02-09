import { Queue } from 'bullmq';
import { redis } from '../lib/redis.js';

export const QUEUE_NAMES = {
  ALERT_SCHEDULER: 'alert-scheduler',
  PRICE_CHECK: 'price-check',
} as const;

export const priceCheckQueue = new Queue(QUEUE_NAMES.PRICE_CHECK, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60_000, // 1 min → 5 min → 15 min (approx)
    },
    removeOnComplete: true,
    removeOnFail: { count: 200 },
  },
});

export const schedulerQueue = new Queue(QUEUE_NAMES.ALERT_SCHEDULER, {
  connection: redis,
});
