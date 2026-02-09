import { Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { QUEUE_NAMES, schedulerQueue } from './queue.js';
import { processPriceCheck } from './price-check.job.js';
import { processScheduler } from './scheduler.js';

let schedulerWorker: Worker | null = null;
let priceCheckWorker: Worker | null = null;

export async function startJobSystem() {
  // Worker for the scheduler queue (runs every 60s via repeatable job)
  schedulerWorker = new Worker(
    QUEUE_NAMES.ALERT_SCHEDULER,
    processScheduler,
    { connection: redis },
  );

  schedulerWorker.on('completed', (job) => {
    console.log(`[scheduler] Scan completed:`, job.returnvalue);
  });

  schedulerWorker.on('failed', (job, err) => {
    console.error(`[scheduler] Job ${job?.id} failed:`, err.message);
  });

  // Worker for individual price-check jobs (concurrency: 3)
  priceCheckWorker = new Worker(
    QUEUE_NAMES.PRICE_CHECK,
    processPriceCheck,
    { connection: redis, concurrency: 3 },
  );

  priceCheckWorker.on('failed', (job, err) => {
    console.error(`[price-check] Job ${job?.id} failed:`, err.message);
  });

  priceCheckWorker.on('completed', (job) => {
    console.log(`[price-check] Job ${job.id} completed:`, job.returnvalue);
  });

  // Add repeatable scheduler job (every 60 seconds)
  await schedulerQueue.upsertJobScheduler(
    'scan-due-alerts',
    { every: 60_000 },
    { name: 'scan' },
  );

  console.log('[jobs] Job system started');
}

export async function stopJobSystem() {
  await schedulerWorker?.close();
  await priceCheckWorker?.close();
  await redis.quit();
  console.log('[jobs] Job system stopped');
}
