import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as reactionService from './reaction.service.js';

export const toggleReactionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { emoji } = req.body;
    const userId = req.user!.id;

    await reactionService.toggleReaction(postId, userId, emoji);

    res.status(200).json({ message: 'Reaction toggled successfully.' });
  },
);
