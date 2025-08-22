import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as userService from './user.service.js';
import ApiError from '../../utils/ApiError.js';

export const getAllUsersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    // page, limit va search'ni query'dan olamiz
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;

    const { data, total } = await userService.findAllUsers(
      { search },
      { page, limit },
    );

    res.status(200).json({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  },
);

export const searchUsersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const searchTerm = req.query.q as string;
    const users = await userService.searchUsers(searchTerm);
    res.status(200).json(users);
  },
);

export const createUserHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await userService.createUser(req.validatedData!.body);
    res.status(201).json(user);
  },
);

export const updateUserHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const updatedUser = await userService.updateUser(
      id,
      req.validatedData!.body,
    );
    res.status(200).json(updatedUser);
  },
);

export const deleteUserHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    await userService.deleteUser(id);
    res.status(204).send(); // Muvaffaqiyatli o'chirildi, javob body'si yo'q
  },
);

export const bulkCreateUsersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, 'Excel fayli yuklanmadi.');
    }
    const result = await userService.bulkCreateUsers(req.file.buffer);
    res.status(201).json({
      message: `${result.count} ta yangi foydalanuvchi muvaffaqiyatli qo'shildi.`,
      data: result,
    });
  },
);
