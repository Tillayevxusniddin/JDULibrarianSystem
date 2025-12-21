// src/api/loan/loan.controller.ts

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as loanService from './loan.service.js';
import prisma from '../../config/db.config.js';

export const createLoanHandler = asyncHandler(
  async (req: Request, res: Response) => {
    // --- O'ZGARISH: bookId -> barcode ---
    const { barcode, userId } = req.validatedData!.body;

    // 1) Check unpaid fines for the user via Prisma aggregate (faster + precise)
    const agg = await prisma.fine.aggregate({
      where: { userId, isPaid: false },
      _sum: { amount: true },
      _count: { _all: true },
    });
    const hasUnpaid = (agg._count?._all ?? 0) > 0;
    const totalAmount = Number(agg._sum?.amount ?? 0);
    if (hasUnpaid && totalAmount > 0) {
      res.status(400).json({
        error: true,
        message: `Foydalanuvchida ${totalAmount} miqdorda to'lanmagan qarz mavjud`,
      });
      return;
    }

    // 2) Continue normal loan creation
    const loan = await loanService.createLoan(barcode, userId);
    res.status(201).json(loan);
  },
);

export const getMyLoansHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    // --- O'ZGARISH: Frontenddan kelgan 'status' filtrini servisga uzatamiz ---
    const { status } = req.validatedData!.query;
    const loans = await loanService.findUserLoans(userId, status);
    res.status(200).json(loans);
  },
);

export const getAllLoansHandler = asyncHandler(
  async (req: Request, res: Response) => {
    // --- O'ZGARISH: Frontenddan kelgan 'filter'ni servisga uzatamiz ---
    const { filter } = req.validatedData!.query;
    const loans = await loanService.findAllLoans(filter);
    res.status(200).json(loans);
  },
);

export const initiateReturnHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const userId = req.user!.id;
    const loan = await loanService.initiateReturn(id, userId);
    res.status(200).json(loan);
  },
);

export const confirmReturnHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const loan = await loanService.confirmReturn(id);
    res.status(200).json(loan);
  },
);

export const directReturnHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const loan = await loanService.directReturn(id);
    res.status(200).json(loan);
  },
);

export const requestRenewalHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const userId = req.user!.id;
    const loan = await loanService.requestRenewal(id, userId);
    res
      .status(200)
      .json({ message: 'Renewal request has been submitted.', loan });
  },
);

export const approveRenewalHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const { newDueDate } = req.validatedData!.body;
    const loan = await loanService.approveRenewal(id, newDueDate);
    res
      .status(200)
      .json({ message: 'Loan period has been successfully extended.', loan });
  },
);

export const rejectRenewalHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const loan = await loanService.rejectRenewal(id);
    res.status(200).json({
      message: 'Loan renewal request has been rejected.',
      loan,
    });
  },
);
