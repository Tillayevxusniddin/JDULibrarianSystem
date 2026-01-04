import { z } from 'zod';

// POST /favorites
export const addFavoriteSchema = z.object({
  body: z.object({
    bookId: z
      .string()
      .uuid({ message: "Kitob IDsi to'g'ri formatda bo'lishi kerak" }),
  }),
});

// DELETE /favorites/:bookId
export const removeFavoriteSchema = z.object({
  params: z.object({
    bookId: z
      .string()
      .uuid({ message: "Kitob IDsi to'g'ri formatda bo'lishi kerak" }),
  }),
});
