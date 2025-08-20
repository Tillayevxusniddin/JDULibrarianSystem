// src/api/suggestion/suggestion.service.ts

import { Prisma, SuggestionStatus, NotificationType } from '@prisma/client';
import prisma from '../../config/db.config.js';
import ApiError from '../../utils/ApiError.js';
import { getIo } from '../../utils/socket.js';

export const createSuggestion = async (
  input: Prisma.BookSuggestionUncheckedCreateInput,
) => {
  const newSuggestion = await prisma.bookSuggestion.create({
    data: input,
    include: { user: true },
  });
  const librarians = await prisma.user.findMany({
    where: { role: 'LIBRARIAN' },
  });
  const notificationData = librarians.map((lib) => ({
    userId: lib.id,
    message: `Foydalanuvchi ${newSuggestion.user.firstName} yangi kitob taklif qildi: "${newSuggestion.title}".`,
    type: NotificationType.INFO,
  }));
  await prisma.notification.createMany({ data: notificationData });

  getIo()
    .to(librarians.map((l) => l.id))
    .emit('refetch_notifications');

  return newSuggestion;
};

export const findAllSuggestions = () => {
  return prisma.bookSuggestion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
};

export const updateSuggestionStatus = async (
  id: string,
  status: SuggestionStatus,
) => {
  const suggestion = await prisma.bookSuggestion.findUnique({ where: { id } });
  if (!suggestion) throw new ApiError(404, 'Suggestion not found.');

  const updatedSuggestion = await prisma.bookSuggestion.update({
    where: { id },
    data: { status },
  });
  const message = `Sizning "${updatedSuggestion.title}" kitob taklifingiz "${status}" statusiga o'zgartirildi.`;
  const newNotification = await prisma.notification.create({
    data: { userId: updatedSuggestion.userId, message, type: 'INFO' },
  });

  getIo()
    .to(updatedSuggestion.userId)
    .emit('new_notification', newNotification);

  return updatedSuggestion;
};
