import { Prisma } from '@prisma/client';
import prisma from '../../config/db.config.js';
import redisClient from '../../config/redis.config.js';

const CATEGORIES_CACHE_KEY = 'categories:all';

export const createCategory = async (input: Prisma.CategoryCreateInput) => {
  const newCategory = await prisma.category.create({
    data: input,
  });
  await redisClient.del(CATEGORIES_CACHE_KEY);
  console.log('Categories cache invalidated.');
  return newCategory;
};

export const findCategoryById = async (id: string) => {
  return prisma.category.findUnique({
    where: { id },
  });
};

export const findAllCategories = async () => {
  const cachedCategories = await redisClient.get(CATEGORIES_CACHE_KEY);

  if (cachedCategories) {
    console.log('Data retrieved from CACHE.');
    return JSON.parse(cachedCategories);
  }

  console.log('Data retrieved from DATABASE.');
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  await redisClient.set(CATEGORIES_CACHE_KEY, JSON.stringify(categories), {
    EX: 3600, // 1 hour
  });

  return categories;
};

export const updateCategory = async (
  id: string,
  data: Prisma.CategoryUpdateInput,
) => {
  const updatedCategory = await prisma.category.update({
    where: { id },
    data,
  });
  await redisClient.del(CATEGORIES_CACHE_KEY);
  console.log('Categories cache invalidated.');
  return updatedCategory;
};

export const deleteCategory = async (id: string) => {
  await prisma.category.delete({
    where: { id },
  });
  await redisClient.del(CATEGORIES_CACHE_KEY);
  console.log('Categories cache invalidated.');
};
