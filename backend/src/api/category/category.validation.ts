import { z } from 'zod';

const emptySchema = z.object({}).optional();

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ error: 'Category name is required' })
      .min(3, 'Name must be at least 3 characters long'),
    description: z.string().optional(),
  }),
  query: emptySchema,
  params: emptySchema,
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Category ID must be a valid UUID' }),
  }),
  body: z.object({
    name: z
      .string()
      .min(3, 'Name must be at least 3 characters long')
      .optional(),
    description: z.string().optional(),
  }),
  query: emptySchema,
});

export const getCategoryByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Category ID must be a valid UUID' }),
  }),
  query: emptySchema,
  body: emptySchema,
});

export const deleteCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Category ID must be a valid UUID' }),
  }),
  query: emptySchema,
  body: emptySchema,
});
