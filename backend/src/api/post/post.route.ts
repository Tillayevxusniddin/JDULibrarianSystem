import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { uploadPostImage } from '../../middlewares/uploadPostImage.middleware.js';
import * as postController from './post.controller.js';
import {
  createPostSchema,
  updatePostSchema,
  postIdParamsSchema,
  channelIdParamsSchema,
} from './post.validation.js';

const router = Router();

router.use(authenticate);

router.get(
  '/channel/:channelId',
  validate(channelIdParamsSchema),
  postController.getPostsByChannelIdHandler,
);

router.post(
  '/',
  uploadPostImage.single('postImage'),
  validate(createPostSchema),
  postController.createPostHandler,
);
router.put(
  '/:postId',
  uploadPostImage.single('postImage'), // <-- YANGI MIDDLEWARE QO'SHILDI
  validate(updatePostSchema),
  postController.updatePostHandler,
);
router.delete(
  '/:postId',
  validate(postIdParamsSchema),
  postController.deletePostHandler,
);

export default router;
