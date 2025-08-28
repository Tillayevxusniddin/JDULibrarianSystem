import { PrismaClient, Prisma } from '@prisma/client';

// Transaction-agnostic client type
type TxClient = PrismaClient | Prisma.TransactionClient;

export const recomputeBookStatus = async (tx: TxClient, bookId: string) => {
  // Fetch counts needed to determine aggregate status
  const [book, awaitingCount] = await Promise.all([
    tx.book.findUnique({ where: { id: bookId }, select: { id: true, totalCopies: true, availableCopies: true, status: true } }),
    tx.reservation.count({ where: { bookId, status: 'AWAITING_PICKUP' } }),
  ]);

  if (!book) return;

  // Determine status:
  // - RESERVED if any AWAITING_PICKUP reservations exist
  // - AVAILABLE if no awaiting and at least one copy is available
  // - BORROWED otherwise (no free copies)
  let newStatus: 'RESERVED' | 'AVAILABLE' | 'BORROWED' = 'BORROWED';
  if (awaitingCount > 0) {
    newStatus = 'RESERVED';
  } else if (book.availableCopies > 0) {
    newStatus = 'AVAILABLE';
  } else {
    newStatus = 'BORROWED';
  }

  if (newStatus !== book.status) {
    await tx.book.update({ where: { id: bookId }, data: { status: newStatus } });
  }
};
