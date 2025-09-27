import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters long'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters long'),
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['USER', 'LIBRARIAN']).optional(),
  }),
});

export const loginUserSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z.string(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(2, 'Ism kamida 2 belgidan iborat bo`lishi kerak')
      .optional(),
    lastName: z
      .string()
      .min(2, 'Familiya kamida 2 belgidan iborat bo`lishi kerak')
      .optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string({
        error: 'Current password is required',
      }),
      newPassword: z
        .string()
        .min(6, 'New password must be at least 6 characters long'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),
});
