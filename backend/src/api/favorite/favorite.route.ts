import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  addFavoriteSchema,
  removeFavoriteSchema,
} from './favorite.validation.js';
import * as favoriteController from './favorite.controller.js';

const router = Router();

// Get user's favorites
router.get('/', authenticate, favoriteController.getUserFavoritesHandler);

// Add to favorites
router.post(
  '/',
  authenticate,
  validate(addFavoriteSchema),
  favoriteController.addFavoriteHandler,
);

// Check if book is favorited
router.get(
  '/:bookId/check',
  authenticate,
  validate(removeFavoriteSchema),
  favoriteController.checkFavoriteHandler,
);

// Remove from favorites
router.delete(
  '/:bookId',
  authenticate,
  validate(removeFavoriteSchema),
  favoriteController.removeFavoriteHandler,
);

export default router;
