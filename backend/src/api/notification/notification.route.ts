import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import * as notificationController from './notification.controller.js';
import { markAsReadSchema } from './notification.validation.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Notifications
 *     description: Foydalanuvchi bildirishnomalarini boshqarish
 */

/**
 * @openapi
 * /api/v1/notifications:
 *   get:
 *     summary: Foydalanuvchining barcha bildirishnomalarini olish
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 *       '401':
 *         description: Avtorizatsiya xatoligi
 */
router.get(
  '/',
  authenticate,
  notificationController.getUserNotificationsHandler,
);

/**
 * @openapi
 * /api/v1/notifications/read-all:
 *   post:
 *     summary: Foydalanuvchining barcha bildirishnomalarini o'qilgan deb belgilash
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 */
router.post(
  '/read-all',
  authenticate,
  notificationController.markAllAsReadHandler,
);

/**
 * @openapi
 * /api/v1/notifications/{id}/read:
 *   post:
 *     summary: Bitta bildirishnomani o'qilgan deb belgilash
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bildirishnomaning IDsi
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 */
router.post(
  '/:id/read',
  authenticate,
  validate(markAsReadSchema),
  notificationController.markAsReadHandler,
);

/**
 * @openapi
 * /api/v1/notifications/read:
 *   delete:
 *     summary: Foydalanuvchining barcha o‘qilgan bildirishnomalarini o‘chirish
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '204':
 *         description: O‘qilgan bildirishnomalar muvaffaqiyatli o‘chirildi
 *       '401':
 *         description: Avtorizatsiya xatoligi
 */
router.delete(
  '/read',
  authenticate,
  notificationController.deleteReadNotificationsHandler,
);

/**
 * @openapi
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Bitta bildirishnomani o‘chirish
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bildirishnomaning IDsi
 *     responses:
 *       '204':
 *         description: Bildirishnoma muvaffaqiyatli o‘chirildi
 *       '401':
 *         description: Avtorizatsiya xatoligi
 *       '404':
 *         description: Bildirishnoma topilmadi
 */
router.delete(
  '/:id',
  authenticate,
  // validate(markAsReadSchema), // ID validatsiyasi uchun shu sxemani ishlatsa bo'ladi
  notificationController.deleteNotificationHandler,
);
export default router;
