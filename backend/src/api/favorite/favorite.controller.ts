import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as favoriteService from './favorite.service.js';

export const addFavoriteHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { bookId } = req.validatedData!.body;

    const favorite = await favoriteService.addFavorite(userId, bookId);
    res.status(201).json(favorite);
  },
);

export const removeFavoriteHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { bookId } = req.validatedData!.params;

    const result = await favoriteService.removeFavorite(userId, bookId);
    res.status(200).json(result);
  },
);

export const getUserFavoritesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const favorites = await favoriteService.getUserFavorites(userId);
    res.status(200).json(favorites);
  },
);

export const checkFavoriteHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { bookId } = req.validatedData!.params;

    const result = await favoriteService.isFavorite(userId, bookId);
    res.status(200).json(result);
  },
);
