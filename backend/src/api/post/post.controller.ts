import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as postService from './post.service.js';
import ApiError from '../../utils/ApiError.js';

export const createPostHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const postData = req.body;
    if (req.file) {
      postData.postImage = '/' + req.file.path.replace(/\\/g, '/');
    } else {
      postData.postImage = '/public/uploads/posts/defaultpost.png';
    }
    const post = await postService.createPost(postData, req.user!.id);
    res.status(201).json({ data: post });
  },
);

export const getPostsByChannelIdHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { channelId } = req.params;
    const posts = await postService.getPostsByChannelId(channelId);
    res.status(200).json({ data: posts });
  },
);

export const updatePostHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    const updateData = req.body;

    // Agar tahrirlash paytida yangi rasm yuklangan bo'lsa
    if (req.file) {
      updateData.postImage = '/' + req.file.path.replace(/\\/g, '/');
    }

    const post = await postService.updatePost(postId, req.user!.id, updateData);
    res
      .status(200)
      .json({ message: 'Post muvaffaqiyatli yangilandi', data: post });
  },
);

export const deletePostHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    await postService.deletePost(postId, req.user!.id);
    res.status(204).send();
  },
);
