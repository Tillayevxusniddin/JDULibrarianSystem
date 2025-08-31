// src/api/loan/loan.route.ts

import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
// --- O'ZGARISH: Yangi validatsiya sxemalari import qilindi ---
import {
  createLoanSchema,
  loanActionSchema,
  getAllLoansSchema,
  getMyLoansSchema,
} from './loan.validation.js';
import * as loanController from './loan.controller.js';

const router = Router();

// ... (OpenAPI izohlari o'zgarishsiz) ...

router.post(
  '/',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(createLoanSchema),
  loanController.createLoanHandler,
);

router.get(
  '/',
  authenticate,
  authorize(['LIBRARIAN']),
  // --- O'ZGARISH: `validate` middleware'i qo'shildi ---
  validate(getAllLoansSchema),
  loanController.getAllLoansHandler,
);

router.get(
  '/my',
  authenticate,
  // --- O'ZGARISH: `validate` middleware'i qo'shildi ---
  validate(getMyLoansSchema),
  loanController.getMyLoansHandler,
);

// ... (qolgan barcha POST yo'nalishlari o'zgarishsiz qoladi) ...

router.post(
  '/:id/return',
  authenticate,
  validate(loanActionSchema),
  loanController.initiateReturnHandler,
);

router.post(
  '/:id/confirm-return',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(loanActionSchema),
  loanController.confirmReturnHandler,
);

router.post(
  '/:id/renew',
  authenticate,
  validate(loanActionSchema),
  loanController.requestRenewalHandler,
);

router.post(
  '/:id/approve-renewal',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(loanActionSchema),
  loanController.approveRenewalHandler,
);

router.post(
  '/:id/reject-renewal',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(loanActionSchema),
  loanController.rejectRenewalHandler,
);

export default router;
