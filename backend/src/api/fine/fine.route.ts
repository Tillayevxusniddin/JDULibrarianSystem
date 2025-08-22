import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import * as fineController from './fine.controller.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  getAllFinesSchema,
  markFineAsPaidSchema,
  createManualFineSchema,
} from './fine.validation.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Fines
 *     description: Jarimalarni boshqarish
 */

/**
 * @openapi
 * /api/v1/fines:
 *   get:
 *     summary: Barcha jarimalar ro'yxatini olish (Faqat kutubxonachi)
 *     tags:
 *       - Fines
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isPaid
 *         schema:
 *           type: boolean
 *         description: To'langan (true) yoki to'lanmagan (false) jarimalarni filtrlash
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Fine'
 *       '403':
 *         description: Ruxsat yo'q
 */
router.get(
  '/',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(getAllFinesSchema),
  fineController.getAllFinesHandler,
);

/**
 * @openapi
 * /api/v1/fines/my:
 *   get:
 *     summary: Foydalanuvchining o'z jarimalari ro'yxatini olish
 *     tags:
 *       - Fines
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Fine'
 *       '401':
 *         description: Avtorizatsiya xatoligi
 */
router.get('/my', authenticate, fineController.getMyFinesHandler);

/**
 * @openapi
 * /api/v1/fines/{id}/pay:
 *   post:
 *     summary: Jarimani to'langan deb belgilash (Faqat kutubxonachi)
 *     tags:
 *       - Fines
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/fineId'
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli to'landi
 *       '400':
 *         description: Jarima allaqachon to'langan
 *       '403':
 *         description: Ruxsat yo'q
 *       '404':
 *         description: Jarima topilmadi
 */
router.post(
  '/:id/pay',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(markFineAsPaidSchema),
  fineController.markFineAsPaidHandler,
);

router.post(
  '/manual',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(createManualFineSchema),
  fineController.createManualFineHandler,
);

export default router;
