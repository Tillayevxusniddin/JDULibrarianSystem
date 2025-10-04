import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { uploadToS3 } from '../../utils/s3.service.js';
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

router.get('/my-posts', postController.getMyPostsHandler);

router.get('/all-posts', postController.getAllPostsHandler);

router.get(
  '/:postId',
  validate(postIdParamsSchema),
  postController.getPostByIdHandler,
);

router.post(
  '/',
  uploadToS3.single('postImage'), // <-- YANGI
  validate(createPostSchema),
  postController.createPostHandler,
);

router.put(
  '/:postId',
  uploadToS3.single('postImage'), // <-- YANGI
  validate(updatePostSchema),
  postController.updatePostHandler,
);

router.delete(
  '/:postId',
  validate(postIdParamsSchema),
  postController.deletePostHandler,
);

export default router;
