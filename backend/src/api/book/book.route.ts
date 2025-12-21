// src/api/book/book.route.ts

import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { uploadExcel } from '../../middlewares/uploadExcel.middleware.js';
import { uploadToS3 } from '../../utils/s3.service.js';
import * as bookController from './book.controller.js';
import {
  createBookSchema,
  updateBookSchema,
  getBooksSchema,
  bookIdParamSchema,
  addBookCopySchema,
  bookCopyIdParamSchema,
  updateBookCopySchema,
  createCommentSchema,
  commentIdParamSchema,
} from './book.validation.js';

const router = Router();

// --- YANGI QO'SHILGAN YO'L ---
// Bu yo'l boshqa POST so'rovlaridan oldin turgani ma'qul,
// toki Express uni "/:id" deb adashtirmasligi uchun.
router.post(
  '/bulk-upload',
  authenticate,
  authorize(['LIBRARIAN']),
  uploadExcel.single('booksFile'), // Faylni qabul qilish uchun (fayl nomi "booksFile" bo'lishi kerak)
  bookController.bulkCreateBooksHandler,
);
// --- YO'L QO'SHILDI ---

// ==========================================================
// ASOSIY KITOB (PASPORT) UCHUN YO'LLAR
// ==========================================================
router.get(
  '/',
  authenticate,
  validate(getBooksSchema),
  bookController.getBooksHandler,
);
router.post(
  '/',
  authenticate,
  authorize(['LIBRARIAN']),
  uploadToS3.single('coverImage'), // <-- YANGI MIDDLEWARE QO'SHILDI
  validate(createBookSchema),
  bookController.createBookHandler,
);
router.get(
  '/:id',
  authenticate,
  validate(bookIdParamSchema),
  bookController.getBookByIdHandler,
);
router.put(
  '/:id',
  authenticate,
  authorize(['LIBRARIAN']),
  uploadToS3.single('coverImage'), // <-- YANGI MIDDLEWARE QO'SHILDI
  validate(updateBookSchema),
  bookController.updateBookHandler,
);

router.delete(
  '/:id',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(bookIdParamSchema),
  bookController.deleteBookHandler,
);

// ==========================================================
// KITOB NUSXALARI (BOOK COPY) UCHUN YANGI YO'LLAR
// ==========================================================
router.post(
  '/:bookId/copies',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(addBookCopySchema),
  bookController.addBookCopyHandler,
);
router.put(
  '/copies/:copyId',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(updateBookCopySchema),
  bookController.updateBookCopyHandler,
);
router.delete(
  '/copies/:copyId',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(bookCopyIdParamSchema),
  bookController.deleteBookCopyHandler,
);

// ==========================================================
// IZOHLAR VA REZERVTSIYA UCHUN YO'LLAR
// ==========================================================
router.post(
  '/:bookId/comments',
  authenticate,
  validate(createCommentSchema),
  bookController.createCommentHandler,
);
router.get(
  '/:bookId/comments',
  authenticate,
  validate(commentIdParamSchema),
  bookController.getCommentsByBookIdHandler,
);

// COMMENTED OUT - Reservation feature disabled
/*
router.post(
  '/:id/reserve',
  authenticate,
  validate(bookIdParamSchema),
  bookController.reserveBookHandler,
);
*/

export default router;
