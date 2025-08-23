// Foydalanuvchi roli
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

// Kitob statuslari
export type BookStatus =
  | 'AVAILABLE'
  | 'BORROWED'
  | 'RESERVED'
  | 'PENDING_RETURN'
  | 'MAINTENANCE';

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

export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverImage?: string;
  status: BookStatus;
  category: Category;
  isbn?: string;
  comments?: BookComment[]; // <-- TUZATISH: Nomi "comments"ga qaytarildi
}

export interface Loan {
  id: string;
  bookId: string;
  userId: string;
  status: LoanStatus;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  renewalRequested: boolean;
  book: {
    id: string;
    title: string;
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
  bookComments?: BookComment[]; // Bu nom to'g'ri, chunki Prisma sxemasida shunday nom berganmiz
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
  loan: {
    book: {
      id: string;
      title: string;
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

export interface Reservation {
  id: string;
  status: ReservationStatus;
  reservedAt: string;
  expiresAt?: string;
  book: Book;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
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
