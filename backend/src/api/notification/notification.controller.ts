import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as notificationService from './notification.service.js';

export const getUserNotificationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const notifications = await notificationService.findUserNotifications(
      userId,
    );
    res.status(200).json(notifications);
  },
);

export const markAsReadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.validatedData!.params;
    await notificationService.markAsRead(id, userId);
    res.status(200).json({ message: 'Notification marked as read.' });
  },
);

export const markAllAsReadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    await notificationService.markAllAsRead(userId);
    res.status(200).json({ message: 'All notifications marked as read.' });
  },
);

export const deleteNotificationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params; // Yoki req.validatedData!.params dan
    await notificationService.deleteNotification(id, userId);
    res.status(204).send();
  },
);

export const deleteReadNotificationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    await notificationService.deleteReadNotifications(userId);
    res.status(204).send();
  },
);
