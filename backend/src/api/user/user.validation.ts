import { z } from 'zod';
import { Role, UserStatus } from '@prisma/client';

const emptySchema = z.object({}).optional();

export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'Ism kamida 2 belgidan iborat bo`lishi kerak'),
    lastName: z
      .string()
      .min(2, 'Familiya kamida 2 belgidan iborat bo`lishi kerak'),
    email: z.string().email('Yaroqli email manzil kiriting'),
    password: z
      .string()
      .min(6, 'Parol kamida 6 belgidan iborat bo`lishi kerak'),
    role: z.nativeEnum(Role).optional(),
  }),
  query: emptySchema,
  params: emptySchema,
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Foydalanuvchi IDsi yaroqli UUID bo`lishi kerak'),
  }),
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
  }),
  query: emptySchema,
});

// --- YANGI SXEMA ---
export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Foydalanuvchi IDsi yaroqli UUID bo`lishi kerak'),
  }),
  body: emptySchema,
  query: emptySchema,
});

export const updateUserPremiumSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    isPremium: z.boolean(),
  }),
});
