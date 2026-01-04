import prisma from '../../config/db.config.js';
import ApiError from '../../utils/ApiError.js';

/**
 * Add a book to user's favorites
 */
export const addFavorite = async (userId: string, bookId: string) => {
  // Check if book exists
  const book = await prisma.book.findUnique({
    where: { id: bookId },
  });
  if (!book) {
    throw new ApiError(404, 'Kitob topilmadi.');
  }

  // Check if already favorited
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
  });
  if (existing) {
    throw new ApiError(400, 'Bu kitob allaqachon sevimlilar ro\'yxatida.');
  }

  // Create favorite
  const favorite = await prisma.favorite.create({
    data: {
      userId,
      bookId,
    },
    include: {
      book: {
        include: {
          category: true,
        },
      },
    },
  });

  return favorite;
};

/**
 * Remove a book from user's favorites
 */
export const removeFavorite = async (userId: string, bookId: string) => {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
  });

  if (!favorite) {
    throw new ApiError(404, 'Bu kitob sevimlilar ro\'yxatida emas.');
  }

  await prisma.favorite.delete({
    where: { id: favorite.id },
  });

  return { message: 'Sevimlilardan olib tashlandi.' };
};

/**
 * Get all favorites for a user
 */
export const getUserFavorites = async (userId: string) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      book: {
        include: {
          category: true,
          copies: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Transform to include computed fields like availableCopies
  return favorites.map((fav) => ({
    ...fav,
    book: {
      ...fav.book,
      totalCopies: fav.book.copies.length,
      availableCopies: fav.book.copies.filter(
        (copy) => copy.status === 'AVAILABLE',
      ).length,
    },
  }));
};

/**
 * Check if a book is in user's favorites
 */
export const isFavorite = async (userId: string, bookId: string) => {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
  });

  return { isFavorite: !!favorite };
};
