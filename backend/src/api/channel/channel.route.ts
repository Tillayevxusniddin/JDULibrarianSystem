import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  createChannelSchema,
  updateChannelSchema,
  channelIdParamsSchema,
} from './channel.validation.js';
import * as channelController from './channel.controller.js';
import { uploadChannelLogo } from '../../middlewares/uploadChannelLogo.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/me/subscriptions', channelController.getFollowedChannelsHandler);
router.get('/my-channel', channelController.getMyChannelHandler);
router.get('/', channelController.getAllChannelsHandler);

router.get('/:linkName', channelController.getChannelByLinkNameHandler);

router.post(
  '/',
  validate(createChannelSchema),
  channelController.createChannelHandler,
);
router.put(
  '/my-channel',
  uploadChannelLogo.single('logoImage'),
  validate(updateChannelSchema),
  channelController.updateMyChannelHandler,
);
router.delete('/my-channel', channelController.deleteMyChannelHandler);
router.post(
  '/:channelId/toggle-follow',
  validate(channelIdParamsSchema),
  channelController.toggleFollowHandler,
);

export default router;
