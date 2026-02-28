import { z } from 'zod';

const emptySchema = z.object({}).optional();

export const updateSettingsSchema = z.object({
  body: z.object({
    enableFines: z.boolean().optional(),
    fineAmountPerDay: z
      .number()
      .positive('Jarima miqdori 0 dan katta bo\'lishi kerak')
      .optional(),
    fineIntervalUnit: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).optional(),
    fineIntervalDays: z
      .number()
      .int()
      .positive('Interval kunlari 0 dan katta bo\'lishi kerak')
      .optional()
      .nullable(),
  }).refine((data) => {
    // If fineIntervalUnit is CUSTOM, fineIntervalDays must be provided
    if (data.fineIntervalUnit === 'CUSTOM' && !data.fineIntervalDays) {
      return false;
    }
    return true;
  }, {
    message: 'CUSTOM interval uchun fineIntervalDays kiritilishi shart.',
    path: ['fineIntervalDays'],
  }),
  query: emptySchema,
  params: emptySchema,
});

export const getSettingsSchema = z.object({
  body: emptySchema,
  query: emptySchema,
  params: emptySchema,
});
