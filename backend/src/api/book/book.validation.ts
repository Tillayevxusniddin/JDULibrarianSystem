import { z } from 'zod';
import { BookCopyStatus } from '@prisma/client';

const emptySchema = z.object({}).optional();

export const createBookSchema = z.object({
  body: z.object({
    title: z.string({ error: 'Sarlavha kiritilishi shart' }),
    author: z.string().optional(),
    description: z.string().optional(),
    publisher: z.string().optional(),
    publishedYear: z.coerce.number().int().positive().optional(),
    pageCount: z.coerce.number().int().positive().optional(),
    categoryId: z
      .string()
      .uuid({ message: "To'g'ri kategoriya IDsi kiritilishi shart" }),
    copies: z
      .array(
        z.object({
          barcode: z
            .string()
            .min(1, "Har bir nusxaning shtrix-kodi bo'lishi shart"),
        }),
      )
      .min(1, "Kamida bitta nusxa qo'shilishi kerak"),
  }),
});

export const updateBookSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().optional(),
    author: z.string().optional(),
    description: z.string().optional(),
    publisher: z.string().optional(),
    publishedYear: z.coerce.number().int().positive().optional(),
    pageCount: z.coerce.number().int().positive().optional(),
    categoryId: z.string().uuid().optional(),
  }),
});

export const addBookCopySchema = z.object({
  params: z.object({ bookId: z.string().uuid() }),
  body: z.object({
    barcode: z.string().min(1, "Nusxaning shtrix-kodi bo'lishi shart"),
  }),
});

// 1-usul: refine() metodidan foydalanish
export const updateBookCopySchema = z.object({
  params: z.object({
    copyId: z.string().uuid(),
  }),
  body: z
    .object({
      status: z.nativeEnum(BookCopyStatus).optional(),
      barcode: z.string().min(1).optional(),
    })
    .refine((data) => data.status !== undefined || data.barcode !== undefined, {
      message:
        "O'zgartirish uchun kamida bitta maydon (status yoki barcode) bo'lishi kerak",
    }),
});

// 2-usul: union bilan
export const updateBookCopySchemaAlternative = z.object({
  params: z.object({
    copyId: z.string().uuid(),
  }),
  body: z.union([
    z.object({
      status: z.nativeEnum(BookCopyStatus),
      barcode: z.string().min(1).optional(),
    }),
    z.object({
      status: z.nativeEnum(BookCopyStatus).optional(),
      barcode: z.string().min(1),
    }),
    z.object({
      status: z.nativeEnum(BookCopyStatus),
      barcode: z.string().min(1),
    }),
  ]),
});

// 3-usul: discriminatedUnion bilan (eng clean)
export const updateBookCopySchemaClean = z.object({
  params: z.object({
    copyId: z.string().uuid(),
  }),
  body: z
    .object({
      status: z.nativeEnum(BookCopyStatus).optional(),
      barcode: z.string().min(1).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.status && !data.barcode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "O'zgartirish uchun kamida bitta maydon (status yoki barcode) bo'lishi kerak",
        });
      }
    }),
});

export const getBooksSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    availability: z.enum(['available', 'borrowed']).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  }),
});

export const bookIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const bookCopyIdParamSchema = z.object({
  params: z.object({ copyId: z.string().uuid() }),
});

export const commentIdParamSchema = z.object({
  params: z.object({ bookId: z.string().uuid() }),
});

export const createCommentSchema = z.object({
  params: z.object({ bookId: z.string().uuid() }),
  body: z.object({
    comment: z.string().min(3),
    rating: z.coerce.number().int().min(1).max(5).optional(),
  }),
});
