import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import * as commentController from './comment.controller.js';
import {
  createCommentSchema,
  getCommentsSchema,
  deleteCommentSchema,
} from './comment.validation.js';

const router = Router();

// Faqat tizimga kirganlar uchun
router.use(authenticate);

router.get(
  '/post/:postId',
  validate(getCommentsSchema),
  commentController.getCommentsByPostIdHandler,
);

router.post(
  '/',
  validate(createCommentSchema),
  commentController.createCommentHandler,
);
router.delete(
  '/:commentId',
  validate(deleteCommentSchema),
  commentController.deleteCommentHandler,
);

export default router;
