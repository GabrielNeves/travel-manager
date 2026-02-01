import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

const dayShiftEnum = z.enum(['MORNING', 'AFTERNOON', 'NIGHT']);
const checkFrequencyEnum = z.enum([
  'HOURS_1',
  'HOURS_3',
  'HOURS_6',
  'HOURS_12',
  'HOURS_24',
]);

export const createAlertSchema = z
  .object({
    departureCity: z.string().min(1, 'Departure city is required'),
    departureAirportCode: z
      .string()
      .length(3, 'Airport code must be 3 characters')
      .toUpperCase(),
    destinationCity: z.string().min(1, 'Destination city is required'),
    destinationAirportCode: z
      .string()
      .length(3, 'Airport code must be 3 characters')
      .toUpperCase(),
    tripType: z.enum(['ONE_WAY', 'ROUND_TRIP']),
    departureDate: dateString,
    departureDateEnd: dateString.optional(),
    departureDayShift: z
      .array(dayShiftEnum)
      .min(1, 'At least one departure time preference is required'),
    returnDate: dateString.optional(),
    returnDateEnd: dateString.optional(),
    returnDayShift: z.array(dayShiftEnum).default([]),
    priceThreshold: z
      .number()
      .positive('Price must be positive')
      .max(99999999),
    airlines: z.array(z.string()).default([]),
    maxFlightDuration: z.number().int().positive().optional(),
    checkFrequency: checkFrequencyEnum.default('HOURS_6'),
  })
  .superRefine((data, ctx) => {
    if (data.tripType === 'ROUND_TRIP' && !data.returnDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Return date is required for round-trip flights',
        path: ['returnDate'],
      });
    }
  });

export const updateAlertSchema = z.object({
  departureCity: z.string().min(1).optional(),
  departureAirportCode: z.string().length(3).toUpperCase().optional(),
  destinationCity: z.string().min(1).optional(),
  destinationAirportCode: z.string().length(3).toUpperCase().optional(),
  tripType: z.enum(['ONE_WAY', 'ROUND_TRIP']).optional(),
  departureDate: dateString.optional(),
  departureDateEnd: dateString.nullable().optional(),
  departureDayShift: z.array(dayShiftEnum).min(1).optional(),
  returnDate: dateString.nullable().optional(),
  returnDateEnd: dateString.nullable().optional(),
  returnDayShift: z.array(dayShiftEnum).optional(),
  priceThreshold: z.number().positive().max(99999999).optional(),
  airlines: z.array(z.string()).optional(),
  maxFlightDuration: z.number().int().positive().nullable().optional(),
  checkFrequency: checkFrequencyEnum.optional(),
});

export const listAlertsQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED']).optional(),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
export type ListAlertsQuery = z.infer<typeof listAlertsQuerySchema>;
