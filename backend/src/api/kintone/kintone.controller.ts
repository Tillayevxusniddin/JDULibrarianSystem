import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { syncStudentsFromKintone } from './kintone.service.js';

export const syncStudentsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const result = await syncStudentsFromKintone();
  res.status(200).json({ message: 'Kintone students synced', result });
});

