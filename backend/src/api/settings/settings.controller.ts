import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as settingsService from './settings.service.js';

export const getSettingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const settings = await settingsService.getSettings();
    res.status(200).json(settings);
  },
);

export const updateSettingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const updatedSettings = await settingsService.updateSettings(
      req.validatedData!.body,
    );
    res.status(200).json(updatedSettings);
  },
);
