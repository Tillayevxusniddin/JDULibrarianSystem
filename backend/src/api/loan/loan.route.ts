import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { createLoanSchema, loanActionSchema } from './loan.validation.js';
import * as loanController from './loan.controller.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Loans
 *     description: Kitob ijarasi bilan bog'liq barcha amallar
 */

/**
 * @openapi
 * /api/v1/loans:
 *   post:
 *     summary: Yangi ijara yozuvini yaratish (Faqat kutubxonachi)
 *     tags:
 *       - Loans
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLoanInput'
 *     responses:
 *       '201':
 *         description: Ijara muvaffaqiyatli yaratildi
 *       '400':
 *         description: Xatolik (masalan, kitob mavjud emas yoki foydalanuvchi limitga yetgan)
 */
router.post(
  '/',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(createLoanSchema),
  loanController.createLoanHandler,
);

/**
 * @openapi
 * /api/v1/loans:
 *   get:
 *     summary: Barcha ijaralar ro'yxatini olish (Faqat kutubxonachi)
 *     tags:
 *       - Loans
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
  loanController.getAllLoansHandler,
);

/**
 * @openapi
 * /api/v1/loans/my:
 *   get:
 *     summary: Foydalanuvchining o'z ijaralari ro'yxatini olish
 *     tags:
 *       - Loans
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 *       '401':
 *         description: Avtorizatsiya xatoligi
 */
router.get('/my', authenticate, loanController.getMyLoansHandler);

/**
 * @openapi
 * /api/v1/loans/{id}/return:
 *   post:
 *     summary: Foydalanuvchi kitobni qaytarishni boshlashi (statusni PENDING_RETURN ga o'tkazadi)
 *     tags:
 *       - Loans
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/loanId'
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 */
router.post(
  '/:id/return',
  authenticate,
  validate(loanActionSchema),
  loanController.initiateReturnHandler,
);

/**
 * @openapi
 * /api/v1/loans/{id}/confirm-return:
 *   post:
 *     summary: Kutubxonachi kitob qaytarilganini tasdiqlashi (statusni RETURNED ga o'tkazadi)
 *     tags:
 *       - Loans
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/loanId'
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli tasdiqlandi
 */
router.post(
  '/:id/confirm-return',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(loanActionSchema),
  loanController.confirmReturnHandler,
);

/**
 * @openapi
 * /api/v1/loans/{id}/renew:
 *   post:
 *     summary: Foydalanuvchi ijara muddatini uzaytirishni so'rashi
 *     tags:
 *       - Loans
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/loanId'
 *     responses:
 *       '200':
 *         description: So'rov muvaffaqiyatli yuborildi
 */
router.post(
  '/:id/renew',
  authenticate,
  validate(loanActionSchema),
  loanController.requestRenewalHandler,
);

/**
 * @openapi
 * /api/v1/loans/{id}/approve-renewal:
 *   post:
 *     summary: Kutubxonachi muddatni uzaytirishni tasdiqlashi
 *     tags:
 *       - Loans
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/loanId'
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli tasdiqlandi
 */
router.post(
  '/:id/approve-renewal',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(loanActionSchema),
  loanController.approveRenewalHandler,
);

/**
 * @openapi
 * /api/v1/loans/{id}/reject-renewal:
 *   post:
 *     summary: Kutubxonachi muddatni uzaytirishni rad etishi
 *     tags:
 *       - Loans
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/loanId'
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli rad etildi
 */
router.post(
  '/:id/reject-renewal',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(loanActionSchema),
  loanController.rejectRenewalHandler,
);

export default router;
