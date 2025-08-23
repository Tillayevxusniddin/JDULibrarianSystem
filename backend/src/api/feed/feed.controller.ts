import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as feedService from './feed.service.js';

export const getFeedHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, total } = await feedService.getUserFeed(userId, {
      page,
      limit,
    });

    res.status(200).json({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  },
);
