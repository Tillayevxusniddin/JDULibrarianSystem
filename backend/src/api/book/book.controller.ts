import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as bookService from './book.service.js';
import ApiError from '../../utils/ApiError.js';

export const createBookHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const bookData = req.validatedData!.body;
    if (req.file) {
      bookData.coverImage = `/${req.file.path.replace(/\\/g, '/')}`;
    }
    const book = await bookService.createBook(bookData);
    res.status(201).json(book);
  },
);

export const getBooksHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, ...filters } = req.validatedData!.query;
    const { data, total } = await bookService.findBooks(filters, {
      page,
      limit,
    });
    res.status(200).json({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  },
);

export const getBookByIdHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const book = await bookService.findBookById(id);
    if (!book) {
      throw new ApiError(404, 'Book not found');
    }
    res.status(200).json(book);
  },
);

export const updateBookHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const updateData = req.validatedData!.body;

    const bookExists = await bookService.findBookById(id);
    if (!bookExists) {
      throw new ApiError(404, 'Book not found');
    }

    if (req.file) {
      updateData.coverImage = `/${req.file.path.replace(/\\/g, '/')}`;
    }
    const updatedBook = await bookService.updateBook(id, updateData);
    res.status(200).json(updatedBook);
  },
);

export const deleteBookHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const bookExists = await bookService.findBookById(id);
    if (!bookExists) {
      throw new ApiError(404, 'Book not found');
    }
    await bookService.deleteBook(id);
    res.status(204).send();
  },
);

export const createCommentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { bookId } = req.validatedData!.params;
    const { comment, rating } = req.validatedData!.body;
    const userId = req.user!.id;

    const newComment = await bookService.createComment({
      bookId,
      userId,
      comment,
      rating,
    });
    res.status(201).json(newComment);
  },
);

export const getCommentsByBookIdHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { bookId } = req.validatedData!.params;
    const comments = await bookService.findCommentsByBookId(bookId);
    res.status(200).json(comments);
  },
);

export const reserveBookHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const bookId = req.validatedData!.params.id;
    const userId = req.user!.id;
    const reservation = await bookService.reserveBook(bookId, userId);
    res.status(201).json({
      message: 'Book reserved successfully.',
      data: reservation,
    });
  },
);

export const bulkCreateBooksHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, 'Excel fayli yuklanmadi.');
    }
    const result = await bookService.bulkCreateBooks(req.file.buffer);
    res.status(201).json({
      message: `${result.count} ta yangi kitob muvaffaqiyatli qo'shildi.`,
      data: result,
    });
  },
);

export const incrementCopiesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const updated = await bookService.incrementCopies(id);
    res.status(200).json({ message: 'Copy added.', data: updated });
  },
);

export const decrementCopiesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const updated = await bookService.decrementCopies(id);
    res.status(200).json({ message: 'Copy removed.', data: updated });
  },
);
