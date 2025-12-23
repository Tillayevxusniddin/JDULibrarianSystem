import { z } from 'zod';

const emptySchema = z.object({}).optional();

export const updateSettingsSchema = z.object({
  body: z.object({
    enableFines: z.boolean().optional(),
    fineAmountPerDay: z
      .number()
      .positive('Jarima miqdori 0 dan katta bo\'lishi kerak')
      .optional(),
  }),
  query: emptySchema,
  params: emptySchema,
});

export const getSettingsSchema = z.object({
  body: emptySchema,
  query: emptySchema,
  params: emptySchema,
});
