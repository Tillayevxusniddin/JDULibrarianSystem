// src/api/fine/fine.validation.ts

import { z } from 'zod';

const emptySchema = z.object({}).optional();

export const getAllFinesSchema = z.object({
  query: z.object({
    isPaid: z.enum(['true', 'false']).optional(),
  }),
  body: emptySchema,
  params: emptySchema,
});

export const markFineAsPaidSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Fine ID must be a valid UUID' }),
  }),
  body: emptySchema,
  query: emptySchema,
});

export const createManualFineSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    // --- O'ZGARISH: bookId -> barcode ---
    barcode: z
      .string()
      .min(1, 'Kitob nusxasining shtrix-kodi kiritilishi shart'),
    amount: z.coerce.number().min(0),
    reason: z
      .string()
      .min(10, "Sabab kamida 10 ta belgidan iborat bo'lishi kerak"),
  }),
});
