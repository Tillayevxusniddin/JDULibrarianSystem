// COMMENTED OUT - Reservation feature disabled
/*
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as reservationService from './reservation.service.js';

export const fulfillReservationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const loan = await reservationService.fulfillReservation(id);
    res
      .status(201)
      .json({
        message: 'Reservation successfully converted to a loan.',
        data: loan,
      });
  },
);

export const getUserReservationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const reservations = await reservationService.findUserReservations(userId);
    res.status(200).json(reservations);
  },
);

export const getAllReservationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const reservations = await reservationService.findAllReservations();
    res.status(200).json(reservations);
  },
);

export const cancelReservationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    await reservationService.cancelReservation(id, userId, userRole);
    res.status(204).send();
  },
);
*/
