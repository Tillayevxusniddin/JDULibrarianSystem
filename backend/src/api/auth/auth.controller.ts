import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as authService from './auth.service.js';
import ApiError from '../../utils/ApiError.js';
import { User, Role } from '@prisma/client';
import jwt from 'jsonwebtoken';

interface AuthenticatedUser {
  id: string;
  role: Role;
}

export const registerUserHandler = async (req: Request, res: Response) => {
  try {
    const user = await authService.createUser(req.body);
    return res.status(201).json({
      message: 'User created successfully',
      data: user,
    });
  } catch (error: any) {
    return res.status(409).json({ message: error.message });
  }
};

export const googleCallbackHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user as AuthenticatedUser;

    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=google-auth-failed`,
      );
    }

    // Endi TypeScript user.id borligini aniq biladi va xatolik bo'lmaydi.
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600', 10) },
    );

    return res.redirect(
      `${process.env.FRONTEND_URL}/google-callback?token=${token}`,
    );
  },
);

export const loginUserHandler = async (req: Request, res: Response) => {
  try {
    const token = await authService.loginUser(req.body);
    return res.status(200).json({
      message: 'Login successful',
      token,
    });
  } catch (error: any) {
    return res.status(401).json({ message: error.message });
  }
};

export const getMeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userProfile = await authService.getProfile(req.user!.id);
    res.status(200).json(userProfile);
  },
);

export const updateProfileHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updatedUser = await authService.updateProfile(
      userId,
      req.validatedData!.body,
    );
    res
      .status(200)
      .json({ message: 'Profile updated successfully', data: updatedUser });
  },
);

export const changePasswordHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    await authService.changePassword(userId, req.validatedData!.body);
    res.status(200).json({ message: 'Password changed successfully.' });
  },
);

export const updateProfilePictureHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) throw new ApiError(400, 'Rasm yuklanmadi.');

    const file = req.file as any;
    const fileUrl = file.location; // <-- S3 URL'ni olamiz

    if (!fileUrl) throw new ApiError(500, "Faylni S3'ga yuklashda xatolik.");

    const updatedUser = await authService.updateProfilePicture(
      req.user!.id,
      fileUrl,
    );
    res
      .status(200)
      .json({
        message: 'Profil rasmi muvaffaqiyatli yangilandi',
        data: updatedUser,
      });
  },
);
