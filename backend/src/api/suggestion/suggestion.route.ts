import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  createSuggestionSchema,
  updateSuggestionSchema,
} from './suggestion.validation.js';
import * as suggestionController from './suggestion.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: Suggestions
 *     description: Kitob takliflarini boshqarish
 */

/**
 * @openapi
 * /api/v1/suggestions:
 *   post:
 *     summary: Yangi kitob taklifini yaratish (Foydalanuvchilar uchun)
 *     tags:
 *       - Suggestions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSuggestionInput'
 *     responses:
 *       '201':
 *         description: Taklif yaratildi
 */
router.post(
  '/',
  authenticate,
  validate(createSuggestionSchema),
  suggestionController.createSuggestionHandler,
);

/**
 * @openapi
 * /api/v1/suggestions:
 *   get:
 *     summary: Barcha takliflar ro'yxatini olish (Faqat kutubxonachi)
 *     tags:
 *       - Suggestions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 */
router.get(
  '/',
  authenticate,
  authorize(['LIBRARIAN']),
  suggestionController.getAllSuggestionsHandler,
);

/**
 * @openapi
 * /api/v1/suggestions/{id}:
 *   put:
 *     summary: Taklif statusini o'zgartirish (Faqat kutubxonachi)
 *     tags:
 *       - Suggestions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Taklifning IDsi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSuggestionStatusInput'
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli yangilandi
 *       '404':
 *         description: Taklif topilmadi
 */
router.put(
  '/:id',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(updateSuggestionSchema),
  suggestionController.updateSuggestionStatusHandler,
);

export default router;
