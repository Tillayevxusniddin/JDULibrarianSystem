import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { getFeedHandler } from './feed.controller.js';

const router = Router();

router.get('/', authenticate, getFeedHandler);

export default router;
