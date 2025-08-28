import { z } from 'zod';
import { BookStatus } from '@prisma/client';

const emptySchema = z.object({}).optional();

export const createBookSchema = z.object({
  body: z.object({
    title: z.string({ error: 'Title is required' }),
    author: z.string({ error: 'Author is required' }),
    description: z.string().optional(),
    isbn: z.string().optional(),
    publisher: z.string().optional(),
    publishedYear: z.coerce.number().int().positive().optional(),
    pageCount: z.coerce.number().int().positive().optional(),
    categoryId: z
      .string()
      .uuid({ message: 'Category ID must be a valid UUID' }),
    totalCopies: z.coerce.number().int().min(1).optional(),
    availableCopies: z.coerce
      .number()
      .int()
      .min(0)
      .optional(),
  }),
  query: emptySchema,
  params: emptySchema,
});

export const updateBookSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Book ID must be a valid UUID' }),
  }),
  body: z.object({
    title: z.string().optional(),
    author: z.string().optional(),
    description: z.string().optional(),
    isbn: z.string().optional(),
    publisher: z.string().optional(),
    publishedYear: z.coerce.number().int().positive().optional(),
    pageCount: z.coerce.number().int().positive().optional(),
    categoryId: z.string().uuid().optional(),
    totalCopies: z.coerce.number().int().min(1).optional(),
    availableCopies: z.coerce.number().int().min(0).optional(),
  }),
  query: emptySchema,
});

export const getBooksSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    status: z.nativeEnum(BookStatus).optional(),
    categoryId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  }),
  body: emptySchema,
  params: emptySchema,
});

export const getBookByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Book ID must be a valid UUID' }),
  }),
  query: emptySchema,
  body: emptySchema,
});

export const deleteBookSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Book ID must be a valid UUID' }),
  }),
  query: emptySchema,
  body: emptySchema,
});

export const createCommentSchema = z.object({
  params: z.object({
    bookId: z.string().uuid({ message: 'Book ID must be a valid UUID' }),
  }),
  body: z.object({
    comment: z.string().min(3, 'Comment must be at least 3 characters long'),
    rating: z.coerce.number().int().min(1).max(5).optional(),
  }),
  query: emptySchema,
});

export const getCommentsByBookIdSchema = z.object({
  params: z.object({
    bookId: z.string().uuid({ message: 'Book ID must be a valid UUID' }),
  }),
  query: emptySchema,
  body: emptySchema,
});

export const reserveBookSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Book ID must be a valid UUID' }),
  }),
  query: emptySchema,
  body: emptySchema,
});

export const changeCopiesSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Book ID must be a valid UUID' }),
  }),
  query: emptySchema,
  body: emptySchema,
});
