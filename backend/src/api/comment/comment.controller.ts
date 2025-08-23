import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as commentService from './comment.service.js';

export const getCommentsByPostIdHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    const comments = await commentService.getCommentsByPostId(postId);
    res.status(200).json({ data: comments });
  },
);

export const createCommentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const comment = await commentService.createComment(req.body, req.user!.id);
    res.status(201).json({ data: comment });
  },
);

export const deleteCommentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { commentId } = req.params;
    await commentService.deleteComment(commentId, req.user!.id);
    res.status(204).send();
  },
);
