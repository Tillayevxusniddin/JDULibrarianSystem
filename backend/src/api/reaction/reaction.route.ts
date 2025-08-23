import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import * as reactionController from './reaction.controller.js';
import { toggleReactionSchema } from './reaction.validation.js';

const router = Router();

router.use(authenticate);

router.post(
  '/:postId',
  validate(toggleReactionSchema),
  reactionController.toggleReactionHandler,
);

export default router;
