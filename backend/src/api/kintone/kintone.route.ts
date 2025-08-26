import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { syncStudentsHandler } from './kintone.controller.js';

const router = Router();

// Trigger a Kintone → Users sync
router.post(
  '/sync-students',
  authenticate,
  authorize(['LIBRARIAN', 'MANAGER']),
  syncStudentsHandler,
);

export default router;

