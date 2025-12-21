// COMMENTED OUT - Reservation feature disabled
/*
import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import * as reservationController from './reservation.controller.js';
import { reservationActionSchema } from './reservation.validation.js';

const router = Router();

router.post(
  '/:id/fulfill',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(reservationActionSchema),
  reservationController.fulfillReservationHandler,
);

router.get(
  '/',
  authenticate,
  authorize(['LIBRARIAN']),
  reservationController.getAllReservationsHandler,
);

router.get(
  '/my',
  authenticate,
  reservationController.getUserReservationsHandler,
);
router.delete(
  '/:id',
  authenticate,
  validate(reservationActionSchema),
  reservationController.cancelReservationHandler,
);

export default router;
*/
