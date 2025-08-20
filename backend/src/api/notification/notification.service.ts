import prisma from '../../config/db.config.js';

export const findUserNotifications = (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const markAsRead = (notificationId: string, userId: string) => {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: userId,
    },
    data: { isRead: true },
  });
};

export const markAllAsRead = (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId },
    data: { isRead: true },
  });
};

export const deleteNotification = (notificationId: string, userId: string) => {
  return prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId: userId, // Foydalanuvchi faqat o'zinikini o'chira oladi
    },
  });
};

export const deleteReadNotifications = (userId: string) => {
  return prisma.notification.deleteMany({
    where: {
      userId: userId,
      isRead: true, // Faqat o'qilganlarni
    },
  });
};
