import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as bookService from './book.service.js';
import ApiError from '../../utils/ApiError.js';

// Kitob "pasporti" uchun handler'lar
export const createBookHandler = asyncHandler(
  async (req: Request, res: Response) => {
    // Endi `req.body`'dan foydalanamiz, chunki `FormData` keladi
    const { copies, ...bookData } = req.body;

    // --- O'ZGARISH: Fayl bor-yo'qligini tekshiramiz ---
    if (req.file) {
      bookData.coverImage = (req.file as any).location; // S3 URL'ni olamiz
    }

    // Nusxalar (copies) string formatida kelishi mumkin, uni JSON'ga o'giramiz
    const parsedCopies =
      typeof copies === 'string' ? JSON.parse(copies) : copies;

    const newBook = await bookService.createBook(bookData, parsedCopies);
    res.status(201).json(newBook);
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
    if (!book) throw new ApiError(404, 'Kitob topilmadi');
    res.status(200).json(book);
  },
);

export const updateBookHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const updateData = req.body;

    // --- O'ZGARISH: Fayl bor-yo'qligini tekshiramiz ---
    if (req.file) {
      updateData.coverImage = (req.file as any).location; // S3 URL'ni olamiz
    }

    const updatedBook = await bookService.updateBook(id, updateData);
    res.status(200).json(updatedBook);
  },
);

export const deleteBookHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    await bookService.deleteBook(id);
    res.status(204).send();
  },
);

export const addBookCopyHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { bookId } = req.validatedData!.params;
    const { barcode } = req.validatedData!.body;
    const newCopy = await bookService.addBookCopy(bookId, barcode);
    res.status(201).json(newCopy);
  },
);

export const updateBookCopyHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { copyId } = req.validatedData!.params;
    const updateData = req.validatedData!.body; // Masalan, { status: 'MAINTENANCE' }
    const updatedCopy = await bookService.updateBookCopy(copyId, updateData);
    res.status(200).json(updatedCopy);
  },
);

export const deleteBookCopyHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { copyId } = req.validatedData!.params;
    await bookService.deleteBookCopy(copyId);
    res.status(204).send();
  },
);

// Izoh va rezervatsiya uchun handler'lar
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
    const { id: bookId } = req.validatedData!.params;
    const userId = req.user!.id;
    const reservation = await bookService.reserveBook(bookId, userId);
    res.status(201).json({
      message: 'Kitob muvaffaqiyatli band qilindi.',
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
    res.status(201).json(result);
  },
);
