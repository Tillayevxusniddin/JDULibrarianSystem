import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  getSettingsSchema,
  updateSettingsSchema,
} from './settings.validation.js';
import * as settingsController from './settings.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: Settings
 *     description: Kutubxona sozlamalarini boshqarish
 */

/**
 * @openapi
 * /api/v1/settings:
 *   get:
 *     summary: Kutubxona sozlamalarini olish
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 */
router.get(
  '/',
  validate(getSettingsSchema),
  settingsController.getSettingsHandler,
);

/**
 * @openapi
 * /api/v1/settings:
 *   patch:
 *     summary: Kutubxona sozlamalarini yangilash (Faqat kutubxonachi/menejer)
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enableFines:
 *                 type: boolean
 *                 description: Avtomatik jarimalarni yoqish/o'chirish
 *               fineAmountPerDay:
 *                 type: number
 *                 description: Kunlik jarima miqdori
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli yangilandi
 */
router.patch(
  '/',
  authorize(['LIBRARIAN', 'MANAGER']),
  validate(updateSettingsSchema),
  settingsController.updateSettingsHandler,
);

export default router;
