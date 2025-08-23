import { z } from 'zod';

export const getCommentsSchema = z.object({
  params: z.object({
    postId: z.string().uuid(),
  }),
});

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Izoh bo`sh bo`lishi mumkin emas.'),
    postId: z.string().uuid(),
    parentId: z.string().uuid().optional().nullable(),
  }),
});

export const deleteCommentSchema = z.object({
  params: z.object({
    commentId: z.string().uuid(),
  }),
});
