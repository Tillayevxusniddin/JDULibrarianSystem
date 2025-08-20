import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as categoryService from './category.service.js';
import ApiError from '../../utils/ApiError.js';

export const createCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await categoryService.createCategory(
      req.validatedData!.body,
    );
    res.status(201).json(category);
  },
);

export const getAllCategoriesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = await categoryService.findAllCategories();
    res.status(200).json(categories);
  },
);

export const getCategoryByIdHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const category = await categoryService.findCategoryById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    res.status(200).json(category);
  },
);

export const updateCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const category = await categoryService.findCategoryById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    const updatedCategory = await categoryService.updateCategory(
      id,
      req.validatedData!.body,
    );
    res.status(200).json(updatedCategory);
  },
);

export const deleteCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const category = await categoryService.findCategoryById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    await categoryService.deleteCategory(id);
    res.status(204).send();
  },
);
