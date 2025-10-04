import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as postService from './post.service.js';
import ApiError from '../../utils/ApiError.js';

export const createPostHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const postData = req.body;
    if (req.file) {
      const file = req.file as any;
      postData.postImage = file.location; // <-- S3 URL'ni olamiz
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
    if (req.file) {
      const file = req.file as any;
      updateData.postImage = file.location; // <-- S3 URL'ni olamiz
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

export const getMyPostsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const posts = await postService.getMyPosts(req.user!.id);
    res.status(200).json({ data: posts });
  },
);

export const getAllPostsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const posts = await postService.getAllPosts();
    res.status(200).json({ data: posts });
  },
);

export const getPostByIdHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    const post = await postService.getPostById(postId);
    res.status(200).json({ data: post });
  },
);
