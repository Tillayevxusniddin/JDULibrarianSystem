import { z } from 'zod';

export const toggleReactionSchema = z.object({
  params: z.object({
    postId: z.string().uuid(),
  }),
  body: z.object({
    // Oddiy emoji validatsiyasi
    emoji: z.string().min(1),
  }),
});
