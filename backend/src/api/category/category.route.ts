import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoryByIdSchema, // <-- Import qilamiz
  deleteCategorySchema,
} from './category.validation.js';
import * as categoryController from './category.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: Categories
 *     description: Kitob kategoriyalarini boshqarish
 */

/**
 * @openapi
 * /api/v1/categories:
 *   post:
 *     summary: Yangi kategoriya yaratish (Faqat kutubxonachi)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryInput'
 *     responses:
 *       '201':
 *         description: Yaratildi
 */
router.post(
  '/',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(createCategorySchema),
  categoryController.createCategoryHandler,
);

/**
 * @openapi
 * /api/v1/categories:
 *   get:
 *     summary: Barcha kategoriyalar ro'yxatini olish
 *     tags:
 *       - Categories
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 */
router.get('/', categoryController.getAllCategoriesHandler);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Bitta kategoriyani ID bo'yicha olish
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kategoriya IDsi
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 *       '404':
 *         description: Kategoriya topilmadi
 */
router.get(
  '/:id',
  validate(getCategoryByIdSchema),
  categoryController.getCategoryByIdHandler,
);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   put:
 *     summary: Kategoriyani tahrirlash (Faqat kutubxonachi)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kategoriya IDsi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryInput'
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli yangilandi
 *       '404':
 *         description: Kategoriya topilmadi
 */
router.put(
  '/:id',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(updateCategorySchema),
  categoryController.updateCategoryHandler,
);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Kategoriyani o'chirish (Faqat kutubxonachi)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kategoriya IDsi
 *     responses:
 *       '204':
 *         description: Muvaffaqiyatli o'chirildi
 *       '404':
 *         description: Kategoriya topilmadi
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(deleteCategorySchema),
  categoryController.deleteCategoryHandler,
);

export default router;
