import {
  PrismaClient,
  Prisma,
  Role,
  UserStatus,
  BookCopyStatus,
  LoanStatus,
  ReservationStatus,
  NotificationType,
  SuggestionStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  console.log('Seeding process started...');

  // Users
  const [manager, librarian, user1, user2, user3] = await Promise.all([
    (async () => {
      const email = 'manager@university.com';
      const password = await bcrypt.hash('manager123', 10);
      return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          firstName: 'Main',
          lastName: 'Manager',
          password,
          role: Role.MANAGER,
          status: UserStatus.ACTIVE,
        },
      });
    })(),
    (async () => {
      const email = 'librarian@university.com';
      const password = await bcrypt.hash('SuperStrongPassword123', 10);
      return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          firstName: 'Main',
          lastName: 'Librarian',
          password,
          role: Role.LIBRARIAN,
          status: UserStatus.ACTIVE,
        },
      });
    })(),
    (async () => {
      const email = 'user@university.com';
      const password = await bcrypt.hash('user123', 10);
      return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          firstName: 'Regular',
          lastName: 'User',
          password,
          role: Role.USER,
          status: UserStatus.ACTIVE,
        },
      });
    })(),
    (async () => {
      const email = 'alice@student.com';
      const password = await bcrypt.hash('alice123', 10);
      return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          firstName: 'Alice',
          lastName: 'Student',
          password,
          role: Role.USER,
          status: UserStatus.ACTIVE,
        },
      });
    })(),
    (async () => {
      const email = 'bob@student.com';
      const password = await bcrypt.hash('bob123', 10);
      return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          firstName: 'Bob',
          lastName: 'Student',
          password,
          role: Role.USER,
          status: UserStatus.ACTIVE,
        },
      });
    })(),
  ]);

  console.log('Users ready:', [manager.email, librarian.email, user1.email, user2.email, user3.email]);

  // Blog/Channel setup
  const [libChannel, userChannel] = await Promise.all([
    prisma.channel.upsert({
      where: { ownerId: librarian.id },
      update: {},
      create: {
        name: 'Library News',
        linkName: 'library-news',
        bio: 'Official library updates and events',
        ownerId: librarian.id,
      },
    }),
    prisma.channel.upsert({
      where: { ownerId: user1.id },
      update: {},
      create: {
        name: 'Campus Reads',
        linkName: 'campus-reads',
        bio: 'Sharing thoughts on books',
        ownerId: user1.id,
      },
    }),
  ]);

  const post1 = await prisma.post.create({
    data: {
      content: 'Welcome to the new semester! Check out our new arrivals.',
      channelId: libChannel.id,
      authorId: librarian.id,
    },
  });
  const post2 = await prisma.post.create({
    data: {
      content: 'Finished reading Dune. Amazing world-building! ⭐️⭐️⭐️⭐️',
      channelId: userChannel.id,
      authorId: user1.id,
    },
  });

  await Promise.all([
    prisma.postComment.create({
      data: {
        content: 'Looking forward to the events!',
        postId: post1.id,
        userId: user2.id,
      },
    }),
    prisma.postReaction.create({
      data: {
        emoji: '👍',
        postId: post1.id,
        userId: user3.id,
      },
    }),
    prisma.follow.upsert({
      where: { channelId_userId: { channelId: libChannel.id, userId: user1.id } },
      update: {},
      create: { channelId: libChannel.id, userId: user1.id },
    }),
  ]);

  // Categories
  const [fiction, nonfiction, science] = await Promise.all([
    prisma.category.upsert({ where: { name: 'Fiction' }, update: {}, create: { name: 'Fiction', description: 'Novels and stories' } }),
    prisma.category.upsert({ where: { name: 'Non-fiction' }, update: {}, create: { name: 'Non-fiction', description: 'Essays and biographies' } }),
    prisma.category.upsert({ where: { name: 'Science' }, update: {}, create: { name: 'Science', description: 'Science and technology' } }),
  ]);

  // Books
  const dune = await prisma.book.create({
    data: {
      title: 'Dune',
      author: 'Frank Herbert',
      description: 'Epic science fiction novel.',
      publisher: 'Chilton Books',
      publishedYear: 1965,
      pageCount: 412,
      categoryId: fiction.id,
    },
  });
  const sapiens = await prisma.book.create({
    data: {
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      description: 'A brief history of humankind.',
      publisher: 'Harper',
      publishedYear: 2011,
      pageCount: 498,
      categoryId: nonfiction.id,
    },
  });
  const physics = await prisma.book.create({
    data: {
      title: 'Fundamentals of Physics',
      author: 'Halliday, Resnick, Walker',
      description: 'Introductory physics textbook.',
      publisher: 'Wiley',
      publishedYear: 2010,
      pageCount: 1328,
      categoryId: science.id,
    },
  });

  // Book copies with different statuses
  const duneCopyA = await prisma.bookCopy.create({ data: { bookId: dune.id, barcode: 'BC-DUNE-001', status: BookCopyStatus.AVAILABLE } });
  const duneCopyB = await prisma.bookCopy.create({ data: { bookId: dune.id, barcode: 'BC-DUNE-002', status: BookCopyStatus.AVAILABLE } });
  const sapiensCopyA = await prisma.bookCopy.create({ data: { bookId: sapiens.id, barcode: 'BC-SAPI-001', status: BookCopyStatus.AVAILABLE } });
  const physicsCopyA = await prisma.bookCopy.create({ data: { bookId: physics.id, barcode: 'BC-PHY-001', status: BookCopyStatus.AVAILABLE } });
  const physicsCopyB = await prisma.bookCopy.create({ data: { bookId: physics.id, barcode: 'BC-PHY-002', status: BookCopyStatus.MAINTENANCE } });

  // Loans: active, returned, overdue, renewal requested
  // Active loan (user1 borrows duneCopyA)
  const activeLoan = await prisma.loan.create({
    data: {
      userId: user1.id,
      bookCopyId: duneCopyA.id,
      borrowedAt: daysAgo(2),
      dueDate: daysFromNow(12),
      status: LoanStatus.ACTIVE,
      renewalRequested: false,
    },
  });
  await prisma.bookCopy.update({ where: { id: duneCopyA.id }, data: { status: BookCopyStatus.BORROWED } });

  // Returned loan (user2 had sapiensCopyA and returned it)
  const returnedLoan = await prisma.loan.create({
    data: {
      userId: user2.id,
      bookCopyId: sapiensCopyA.id,
      borrowedAt: daysAgo(20),
      dueDate: daysAgo(5),
      returnedAt: daysAgo(4),
      status: LoanStatus.RETURNED,
      renewalRequested: false,
    },
  });
  await prisma.bookCopy.update({ where: { id: sapiensCopyA.id }, data: { status: BookCopyStatus.AVAILABLE } });

  // Overdue loan with fine (user3 borrows duneCopyB and is overdue)
  const overdueLoan = await prisma.loan.create({
    data: {
      userId: user3.id,
      bookCopyId: duneCopyB.id,
      borrowedAt: daysAgo(30),
      dueDate: daysAgo(10),
      status: LoanStatus.OVERDUE,
      renewalRequested: false,
    },
  });
  await prisma.bookCopy.update({ where: { id: duneCopyB.id }, data: { status: BookCopyStatus.BORROWED } });
  const fine = await prisma.fine.create({
    data: {
      amount: new Prisma.Decimal('12.50'),
      reason: 'Overdue book fine',
      loanId: overdueLoan.id,
      userId: user3.id,
      isPaid: false,
    },
  });

  // Renewal requested (user1 requests renewal on activeLoan's copy is already used; create another)
  const renewalCopy = await prisma.bookCopy.create({ data: { bookId: physics.id, barcode: 'BC-PHY-003', status: BookCopyStatus.AVAILABLE } });
  const renewalLoan = await prisma.loan.create({
    data: {
      userId: user1.id,
      bookCopyId: renewalCopy.id,
      borrowedAt: daysAgo(13),
      dueDate: daysFromNow(1),
      status: LoanStatus.ACTIVE,
      renewalRequested: true,
    },
  });
  await prisma.bookCopy.update({ where: { id: renewalCopy.id }, data: { status: BookCopyStatus.BORROWED } });

  // Reservations across statuses
  const activeReservation = await prisma.reservation.create({
    data: {
      userId: user2.id,
      bookId: dune.id,
      reservedAt: new Date(),
      status: ReservationStatus.ACTIVE,
      expiresAt: daysFromNow(3),
    },
  });

  const awaitingPickupReservation = await prisma.reservation.create({
    data: {
      userId: user1.id,
      bookId: physics.id,
      reservedAt: daysAgo(1),
      status: ReservationStatus.AWAITING_PICKUP,
      assignedCopyId: physicsCopyA.id,
      expiresAt: daysFromNow(2),
    },
  });

  const fulfilledReservation = await prisma.reservation.create({
    data: {
      userId: user3.id,
      bookId: sapiens.id,
      reservedAt: daysAgo(10),
      status: ReservationStatus.FULFILLED,
      assignedCopyId: sapiensCopyA.id,
      expiresAt: daysAgo(8),
    },
  });

  const expiredReservation = await prisma.reservation.create({
    data: {
      userId: manager.id,
      bookId: physics.id,
      reservedAt: daysAgo(5),
      status: ReservationStatus.EXPIRED,
      expiresAt: daysAgo(1),
    },
  });

  const cancelledReservation = await prisma.reservation.create({
    data: {
      userId: librarian.id,
      bookId: dune.id,
      reservedAt: daysAgo(2),
      status: ReservationStatus.CANCELLED,
      expiresAt: daysFromNow(1),
    },
  });

  // Book comments
  await Promise.all([
    prisma.bookComment.create({ data: { bookId: dune.id, userId: user1.id, comment: 'Fantastic sci-fi classic!', rating: 5 } }),
    prisma.bookComment.create({ data: { bookId: sapiens.id, userId: user2.id, comment: 'Thought-provoking and well written', rating: 4 } }),
    prisma.bookComment.create({ data: { bookId: physics.id, userId: user3.id, comment: 'Dense but comprehensive', rating: 4 } }),
  ]);

  // Suggestions in multiple statuses
  await Promise.all([
    prisma.bookSuggestion.create({ data: { title: 'Clean Code', author: 'Robert C. Martin', note: 'Great for students', status: SuggestionStatus.PENDING, userId: user1.id } }),
    prisma.bookSuggestion.create({ data: { title: 'Atomic Habits', author: 'James Clear', note: 'Highly requested', status: SuggestionStatus.APPROVED, userId: user2.id } }),
    prisma.bookSuggestion.create({ data: { title: 'Some Random Book', author: 'Unknown', note: 'Not relevant to curriculum', status: SuggestionStatus.REJECTED, userId: user3.id } }),
  ]);

  // Notifications for different types
  await Promise.all([
    prisma.notification.create({ data: { userId: user1.id, message: 'Your reserved book is ready for pickup', type: NotificationType.RESERVATION_AVAILABLE, link: `/reservations/${awaitingPickupReservation.id}` } }),
    prisma.notification.create({ data: { userId: user3.id, message: 'You have an unpaid fine', type: NotificationType.FINE, link: `/fines/${fine.id}` } }),
    prisma.notification.create({ data: { userId: librarian.id, message: 'System maintenance scheduled tonight', type: NotificationType.INFO } }),
    prisma.notification.create({ data: { userId: manager.id, message: 'High number of overdues this week', type: NotificationType.WARNING } }),
  ]);

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
