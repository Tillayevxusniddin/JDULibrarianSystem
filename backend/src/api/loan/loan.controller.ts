import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as loanService from './loan.service.js';

export const createLoanHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { bookId, userId } = req.validatedData!.body;
    const loan = await loanService.createLoan(bookId, userId);
    res.status(201).json(loan);
  },
);

export const getMyLoansHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const loans = await loanService.findUserLoans(userId);
    res.status(200).json(loans);
  },
);

export const getAllLoansHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const loans = await loanService.findAllLoans();
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
    const loan = await loanService.approveRenewal(id);
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
