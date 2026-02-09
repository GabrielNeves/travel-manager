import { z } from 'zod';

export const priceHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['recent', 'cheapest']).default('recent'),
});

export type PriceHistoryQuery = z.infer<typeof priceHistoryQuerySchema>;
