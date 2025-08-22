import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as dashboardService from './dashboard.service.js';
import { Role } from '@prisma/client';

export const getStatsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user!;
    let stats;

    if (user.role === Role.LIBRARIAN) {
      stats = await dashboardService.getLibrarianStats();
    } else {
      stats = await dashboardService.getUserStats(user.id);
    }

    res.status(200).json({ data: stats });
  },
);
