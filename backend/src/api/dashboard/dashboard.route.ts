import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { getStatsHandler } from './dashboard.controller.js';

const router = Router();

// Bu route faqat tizimga kirgan foydalanuvchilar uchun
router.get('/stats', authenticate, getStatsHandler);

export default router;
