import { z } from 'zod';

const emptySchema = z.object({}).optional();

// POST /loans
export const createLoanSchema = z.object({
  body: z.object({
    barcode: z
      .string()
      .min(1, 'Kitob nusxasining shtrix-kodi kiritilishi shart'),
    userId: z
      .string()
      .uuid({ message: "Foydalanuvchi IDsi to'g'ri formatda bo'lishi kerak" }),
  }),
});

// GET /loans
export const getAllLoansSchema = z.object({
  query: z.object({
    filter: z.enum(['pending', 'renewal', 'active', 'history']).optional(),
  }),
});

// GET /loans/my
export const getMyLoansSchema = z.object({
  query: z.object({
    status: z.enum(['active', 'history']).optional(),
  }),
});

// Masalan, POST /loans/:id/return
export const loanActionSchema = z.object({
  params: z.object({
    id: z
      .string()
      .uuid({ message: "Ijara IDsi to'g'ri formatda bo'lishi kerak" }),
  }),
});
