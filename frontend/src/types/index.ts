export type UserRole = 'LIBRARIAN' | 'USER' | 'MANAGER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'PENDING_RETURN';
export type NotificationType =
  | 'INFO'
  | 'WARNING'
  | 'FINE'
  | 'RESERVATION_AVAILABLE';
export type ReservationStatus =
  | 'ACTIVE'
  | 'AWAITING_PICKUP'
  | 'FULFILLED'
  | 'EXPIRED'
  | 'CANCELLED';

export type BookCopyStatus = 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE' | 'LOST';

// --- INTERFEYSLAR ---
export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface BookComment {
  id: string;
  comment: string;
  rating?: number;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// --- YANGI INTERFEYS ---
// Har bir jismoniy kitob nusxasi uchun
export interface BookCopy {
  id: string;
  barcode: string;
  status: BookCopyStatus;
  bookId: string;
  // Ba'zan backend bu ma'lumotni ham qo'shib berishi mumkin
  book?: {
    id: string;
    title: string;
    coverImage?: string;
  };
}

// --- O'ZGARTIRILDI ---
// Book interfeysi endi "pasport" ma'lumotlarini va nusxalar ro'yxatini saqlaydi
export interface Book {
  id: string;
  title: string;
  author: string | null; // Muallif ixtiyoriy bo'ldi
  description?: string;
  coverImage?: string;
  category: Category;
  isbn?: string;
  comments?: BookComment[];

  // Backend bu ma'lumotlarni virtual hisoblab beradi
  totalCopies: number;
  availableCopies: number;

  // Kitobning barcha jismoniy nusxalari ro'yxati
  copies: BookCopy[];
}

// --- O'ZGARTIRILDI ---
// Loan interfeysi endi BookCopy'ga bog'lanadi
export interface Loan {
  id: string;
  userId: string;
  bookCopyId: string; // bookId o'rniga
  status: LoanStatus;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  renewalRequested: boolean;

  // Endi zanjir quyidagicha bo'ladi: Loan -> BookCopy -> Book
  bookCopy: {
    id: string;
    barcode: string;
    book: {
      id: string;
      title: string;
    };
  };

  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  profilePicture?: string;
  isPremium: boolean;
}

export interface Suggestion {
  id: string;
  title: string;
  author?: string;
  note?: string;
  status: SuggestionStatus;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// --- O'ZGARTIRILDI ---
// Fine interfeysi ham Loan orqali BookCopy'ga bog'lanadi
export interface Fine {
  id: string;
  amount: number;
  reason: string;
  isPaid: boolean;
  paidAt?: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  loan?: {
    // Jarima ijaraga bog'liq bo'lmasligi ham mumkin
    bookCopy: {
      barcode: string;
      book: {
        id: string;
        title: string;
      };
    };
  };
}

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

// --- O'ZGARTIRILDI ---
// Reservation'ga nusxa tayinlanganini bilish uchun maydon qo'shildi
export interface Reservation {
  id: string;
  status: ReservationStatus;
  reservedAt: string;
  expiresAt?: string;
  book: Book; // Rezervatsiya kitob nomiga bo'ladi
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignedCopyId?: string | null; // Qaysi nusxa tayinlangani
}

export interface Channel {
  id: string;
  name: string;
  linkName: string;
  bio?: string;
  logoImage?: string;
  ownerId: string;
  owner?: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  posts?: Post[];
  _count?: {
    followers: number;
  };
  isFollowed?: boolean;
}

export interface Post {
  id: string;
  content: string;
  postImage?: string;
  createdAt: string;
  authorId: string;
  channelId: string;
  channel?: Channel;
  author: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  reactions: PostReaction[];
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  postId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  parentId: string | null;
  replies: PostComment[];
}

export interface PostReaction {
  emoji: string;
  userId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
