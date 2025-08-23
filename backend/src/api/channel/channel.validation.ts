import { z } from 'zod';

export const createChannelSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, 'Kanal nomi kamida 3 ta belgidan iborat bo`lishi kerak'),
    linkName: z
      .string()
      .min(4, 'Havola nomi kamida 4 ta belgidan iborat bo`lishi kerak')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Havola nomi faqat harflar, sonlar va pastki chiziqdan iborat bo`lishi mumkin',
      ),
    bio: z
      .string()
      .max(255, 'Tavsif 255 ta belgidan oshmasligi kerak')
      .optional(),
  }),
});

export const updateChannelSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    bio: z.string().max(255).optional(),
  }),
});

export const channelIdParamsSchema = z.object({
  params: z.object({
    channelId: z.string().uuid(),
  }),
});
