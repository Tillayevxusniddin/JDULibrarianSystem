import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as fineService from './fine.service.js';

export const getAllFinesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const fines = await fineService.findAllFines(req.validatedData!.query);
    res.status(200).json(fines);
  },
);

export const getMyFinesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const fines = await fineService.findUserFines(userId);
    res.status(200).json(fines);
  },
);

export const markFineAsPaidHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const updatedFine = await fineService.markFineAsPaid(id);
    res
      .status(200)
      .json({ message: 'Fine has been paid successfully.', data: updatedFine });
  },
);

export const createManualFineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const fineData = req.validatedData!.body;
    const newFine = await fineService.createManualFine(fineData);
    res.status(201).json({
      message: 'Jarima muvaffaqiyatli yaratildi.',
      data: newFine,
    });
  },
);

export const updateFineAmountHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const { amount } = req.validatedData!.body;
    const updatedFine = await fineService.updateFineAmount(id, amount);
    res.status(200).json({
      message: 'Jarima miqdori muvaffaqiyatli yangilandi.',
      data: updatedFine,
    });
  },
);
