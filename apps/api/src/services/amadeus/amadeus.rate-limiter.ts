import { redis } from '../../lib/redis.js';
import { env } from '../../lib/env.js';

function getMonthlyKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `amadeus:calls:${yyyy}-${mm}`;
}

const TTL_SECONDS = 35 * 24 * 60 * 60; // 35 days

export async function incrementAndCheck(): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
}> {
  const limit = parseInt(env.AMADEUS_MONTHLY_CALL_LIMIT, 10);

  // Limit disabled
  if (limit === 0) {
    return { allowed: true, current: 0, limit: 0 };
  }

  const key = getMonthlyKey();
  const current = await redis.incr(key);

  // Set TTL on first increment so the key auto-cleans
  if (current === 1) {
    await redis.expire(key, TTL_SECONDS);
  }

  if (current >= Math.floor(limit * 0.8) && current < limit) {
    console.warn(
      `[rate-limiter] Amadeus API usage at ${current}/${limit} (${Math.round((current / limit) * 100)}%)`,
    );
  }

  if (current > limit) {
    console.error(
      `[rate-limiter] Amadeus monthly limit exceeded: ${current}/${limit}. Skipping API call.`,
    );
    return { allowed: false, current, limit };
  }

  return { allowed: true, current, limit };
}

export async function getCurrentUsage(): Promise<{
  current: number;
  limit: number;
}> {
  const limit = parseInt(env.AMADEUS_MONTHLY_CALL_LIMIT, 10);
  const key = getMonthlyKey();
  const val = await redis.get(key);
  const current = val ? parseInt(val, 10) : 0;
  return { current, limit };
}
