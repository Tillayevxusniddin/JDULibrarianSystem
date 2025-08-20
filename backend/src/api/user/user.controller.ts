import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as userService from './user.service.js';

export const getAllUsersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const users = await userService.findAllUsers();
    res.status(200).json(users);
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

// --- YANGI HANDLER ---
export const deleteUserHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    await userService.deleteUser(id);
    res.status(204).send(); // Muvaffaqiyatli o'chirildi, javob body'si yo'q
  },
);
