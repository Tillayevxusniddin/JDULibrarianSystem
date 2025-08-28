import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { uploadExcel } from '../../middlewares/uploadExcel.middleware.js';
import {
  createBookSchema,
  updateBookSchema,
  createCommentSchema,
  getBooksSchema,
  getBookByIdSchema,
  deleteBookSchema,
  getCommentsByBookIdSchema,
  reserveBookSchema,
  changeCopiesSchema,
} from './book.validation.js';
import { upload } from '../../utils/fileUpload.js';
import * as bookController from './book.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: Books
 *     description: Kitoblarni va ular bilan bog'liq amallarni boshqarish
 */

/**
 * @openapi
 * /api/v1/books:
 *   post:
 *     summary: Yangi kitob yaratish (Faqat kutubxonachi)
 *     tags:
 *       - Books
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - categoryId
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 format: uuid
  *               totalCopies:
  *                 type: integer
  *                 minimum: 1
  *                 default: 1
  *                 description: Jami nusxalar soni (multi-copy). Agar kiritilmasa 1.
  *               availableCopies:
  *                 type: integer
  *                 minimum: 0
  *                 description: Mavjud nusxalar soni. Kiritilmasa totalCopies ga teng bo'ladi.
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '201':
 *         description: Yaratildi
 */
router.post(
  '/',
  authenticate,
  authorize(['LIBRARIAN']),
  upload.single('coverImage'),
  validate(createBookSchema),
  bookController.createBookHandler,
);

/**
 * @openapi
 * /api/v1/books:
 *   get:
 *     summary: Kitoblarni qidirish, filtrlash va paginatsiya bilan olish
 *     tags:
 *       - Books
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Sarlavha yoki muallif bo'yicha qidiruv
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sahifa raqami
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Bitta sahifadagi kitoblar soni
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 */
router.get('/', validate(getBooksSchema), bookController.getBooksHandler);

/**
 * @openapi
 * /api/v1/books/{id}:
 *   get:
 *     summary: Bitta kitobni ID bo'yicha olish
 *     tags:
 *       - Books
 *     parameters:
 *       - $ref: '#/components/parameters/bookId'
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 *       '404':
 *         description: Kitob topilmadi
 */
router.get(
  '/:id',
  validate(getBookByIdSchema),
  bookController.getBookByIdHandler,
);

/**
 * @openapi
 * /api/v1/books/{id}:
 *   put:
 *     summary: Kitobni tahrirlash (Faqat kutubxonachi)
 *     tags:
 *       - Books
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/bookId'
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
  *               totalCopies:
  *                 type: integer
  *                 minimum: 1
  *                 description: Jami nusxalar soni. availableCopies undan oshmaydi.
  *               availableCopies:
  *                 type: integer
  *                 minimum: 0
  *                 description: Mavjud nusxalar soni (0..totalCopies). Status avtomatik qayta hisoblanadi.
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Yangilandi
 *       '404':
 *         description: Kitob topilmadi
 */
router.put(
  '/:id',
  authenticate,
  authorize(['LIBRARIAN']),
  upload.single('coverImage'),
  validate(updateBookSchema),
  bookController.updateBookHandler,
);

/**
 * @openapi
 * /api/v1/books/{id}:
 *   delete:
 *     summary: Kitobni o'chirish (Faqat kutubxonachi)
 *     tags:
 *       - Books
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/bookId'
 *     responses:
 *       '204':
 *         description: O'chirildi
 *       '404':
 *         description: Kitob topilmadi
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(deleteBookSchema),
  bookController.deleteBookHandler,
);

/**
 * @openapi
 * /api/v1/books/{bookId}/comments:
 *   post:
 *     summary: Kitobga izoh qo'shish (Tizimga kirgan foydalanuvchilar)
 *     tags:
 *       - Books
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kitob IDsi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentInput'
 *     responses:
 *       '201':
 *         description: Izoh yaratildi
 */
router.post(
  '/:bookId/comments',
  authenticate,
  validate(createCommentSchema),
  bookController.createCommentHandler,
);

/**
 * @openapi
 * /api/v1/books/{bookId}/comments:
 *   get:
 *     summary: Kitobning barcha izohlarini olish
 *     tags:
 *       - Books
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kitob IDsi
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 */
router.get(
  '/:bookId/comments',
  validate(getCommentsByBookIdSchema),
  bookController.getCommentsByBookIdHandler,
);

/**
 * @openapi
 * /api/v1/books/{id}/reserve:
 *   post:
 *     summary: Ijaradagi kitobni band qilish (navbatga yozilish)
 *     tags:
 *       - Books
 *     security:
 *       - bearerAuth: []
  *     description: |
  *       Multi-copy mantiqi: Agar `availableCopies > 0` bo'lsa, rezervatsiya `AWAITING_PICKUP`
  *       holatiga o'tadi va bir nusxa ushlab turiladi (48 soat). Aks holda, foydalanuvchi
  *       `ACTIVE` navbatiga qo'shiladi. Qaytarishda navbatdagiga `AWAITING_PICKUP` beriladi yoki
  *       navbat yo'q bo'lsa `availableCopies` oshiriladi.
 *     parameters:
 *       - $ref: '#/components/parameters/bookId'
 *     responses:
 *       '201':
 *         description: Muvaffaqiyatli band qilindi
 *       '400':
 *         description: Xatolik (masalan, kitob ijarada emas)
 */
router.post(
  '/:id/reserve',
  authenticate,
  validate(reserveBookSchema),
  bookController.reserveBookHandler,
);

router.post(
  '/bulk-upload',
  authenticate,
  authorize(['LIBRARIAN']),
  uploadExcel.single('booksFile'),
  bookController.bulkCreateBooksHandler,
);

/**
 * @openapi
 * /api/v1/books/{id}/copies/increment:
 *   post:
 *     summary: Jami/mavjud nusxalarni bitta donaga oshirish (Faqat kutubxonachi)
 *     tags:
 *       - Books
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/bookId'
 *     responses:
 *       '200':
 *         description: Nusxa qo'shildi
 */
router.post(
  '/:id/copies/increment',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(changeCopiesSchema),
  bookController.incrementCopiesHandler,
);

/**
 * @openapi
 * /api/v1/books/{id}/copies/decrement:
 *   post:
 *     summary: Jami/mavjud nusxalarni bitta donaga kamaytirish (Faqat kutubxonachi)
 *     description: Faqat mavjud (iqaraga berilmagan/bandal holatda bo'lmagan) nusxa bo'lsa kamaytiriladi va umumiy son 1 dan kam bo'lmaydi.
 *     tags:
 *       - Books
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/bookId'
 *     responses:
 *       '200':
 *         description: Nusxa olib tashlandi
 *       '400':
 *         description: Nusxani kamaytirib bo'lmadi (band/ijarada) yoki minimal chegaraga yetgan
 */
router.post(
  '/:id/copies/decrement',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(changeCopiesSchema),
  bookController.decrementCopiesHandler,
);

export default router;
