import { z } from 'zod';

const emptySchema = z.object({}).optional();

export const createLoanSchema = z.object({
  body: z.object({
    bookId: z.string().uuid({ message: 'A valid book ID is required' }),
    userId: z.string().uuid({ message: 'A valid user ID is required' }),
  }),
  query: emptySchema,
  params: emptySchema,
});

export const loanActionSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'A valid loan ID is required' }),
  }),
  body: emptySchema,
  query: emptySchema,
});
