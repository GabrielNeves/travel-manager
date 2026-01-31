import { z } from 'zod';

export const updateSettingsSchema = z.object({
  notifyInApp: z.boolean().optional(),
  notifyWhatsApp: z.boolean().optional(),
  notifyPush: z.boolean().optional(),
  notifyOnHistoricalLow: z.boolean().optional(),
  defaultCheckFrequency: z
    .enum(['HOURS_1', 'HOURS_3', 'HOURS_6', 'HOURS_12', 'HOURS_24'])
    .optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
