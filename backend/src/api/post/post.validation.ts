import { z } from 'zod';

export const createPostSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Post matni bo`sh bo`lishi mumkin emas.'),
  }),
});

export const updatePostSchema = z.object({
  params: z.object({ postId: z.string().uuid() }),
  body: z.object({
    content: z.string().min(1).optional(),
  }),
});

export const postIdParamsSchema = z.object({
  params: z.object({ postId: z.string().uuid() }),
});

export const channelIdParamsSchema = z.object({
  params: z.object({ channelId: z.string().uuid() }),
});
