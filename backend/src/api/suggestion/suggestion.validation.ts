import { z } from 'zod';
import { SuggestionStatus } from '@prisma/client';

const emptySchema = z.object({}).optional();

export const createSuggestionSchema = z.object({
  body: z.object({
    title: z.string({ error: 'Title is required' }),
    author: z.string().optional(),
    note: z.string().optional(),
  }),
  query: emptySchema,
  params: emptySchema,
});

export const updateSuggestionSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Suggestion ID must be a valid UUID' }),
  }),
  body: z.object({
    status: z.nativeEnum(SuggestionStatus, {
      error: "Status 'PENDING', 'APPROVED' yoki 'REJECTED' bo'lishi kerak",
    }),
  }),
  query: emptySchema,
});
