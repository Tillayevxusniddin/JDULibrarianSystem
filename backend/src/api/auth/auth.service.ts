import { User, Prisma } from '@prisma/client';
import prisma from '../../config/db.config.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ApiError from '../../utils/ApiError.js';
import fs from 'fs';
import path from 'path';

export const createUser = async (
  input: Prisma.UserCreateInput,
): Promise<Omit<User, 'password'>> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new Error('This email is already in use.');
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      ...input,
      password: hashedPassword,
    },
  });

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const loginUser = async (
  input: Pick<User, 'email' | 'password'>,
): Promise<string> => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = parseInt(process.env.JWT_EXPIRES_IN || '3600', 10);

  if (!jwtSecret) {
    console.error('ERROR: JWT_SECRET is not defined in the .env file!');
    throw new Error('Internal server configuration error.');
  }

  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid email or password');
  }

  const payload = {
    id: user.id,
    role: user.role,
  };

  const options: jwt.SignOptions = {
    expiresIn: jwtExpiresIn,
  };

  const token = jwt.sign(payload, jwtSecret, options);

  return token;
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      profilePicture: true, // <-- TUZATISH 1: SHU QATOR QO'SHILDI
      createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

export const updateProfile = async (
  userId: string,
  data: Prisma.UserUpdateInput,
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      profilePicture: true, // <-- TUZATISH 2: SHU QATOR QO'SHILDI
      createdAt: true,
    },
  });
  return user;
};

export const changePassword = async (userId: string, input: any) => {
  const { currentPassword, newPassword } = input;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const isPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.password,
  );
  if (!isPasswordCorrect) {
    throw new ApiError(400, 'Incorrect current password.');
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });
};

export const updateProfilePicture = async (
  userId: string,
  filePath: string,
) => {
  const userWithOldPicture = await prisma.user.findUnique({
    where: { id: userId },
    select: { profilePicture: true },
  });

  if (userWithOldPicture?.profilePicture) {
    const oldPath = path.join(
      process.cwd(),
      'public',
      userWithOldPicture.profilePicture,
    );
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (err) {
        console.error("Eski rasmni o'chirishda xatolik:", err);
      }
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      profilePicture: filePath,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      profilePicture: true,
      createdAt: true,
    },
  });
  return updatedUser;
};
