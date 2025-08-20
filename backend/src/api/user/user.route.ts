import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import * as userController from './user.controller.js';
import {
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
} from './user.validation.js';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize(['LIBRARIAN']),
  userController.getAllUsersHandler,
);

router.post(
  '/',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(createUserSchema),
  userController.createUserHandler,
);

router.put(
  '/:id',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(updateUserSchema),
  userController.updateUserHandler,
);

// --- YANGI ROUTE ---
router.delete(
  '/:id',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(deleteUserSchema),
  userController.deleteUserHandler,
);

router.get(
  '/search',
  authenticate,
  authorize(['LIBRARIAN']),
  userController.searchUsersHandler,
);

export default router;
