import { z } from 'zod';

const emptySchema = z.object({}).optional();

export const markAsReadSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Notification ID must be a valid UUID' }),
  }),
  body: emptySchema,
  query: emptySchema,
});
