import { z } from 'zod';

// Qayta ishlatish uchun bo'sh obyekt sxemasi
const emptySchema = z.object({}).optional();

// GET /fines uchun query parametrlarini tekshirish
export const getAllFinesSchema = z.object({
  query: z.object({
    isPaid: z.enum(['true', 'false']).optional(),
  }),
  body: emptySchema,
  params: emptySchema,
});

// POST /fines/:id/pay uchun params'ni tekshirish
export const markFineAsPaidSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Fine ID must be a valid UUID' }),
  }),
  body: emptySchema,
  query: emptySchema,
});
