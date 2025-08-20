// Foydalanuvchi roli
export type UserRole = 'LIBRARIAN' | 'USER';
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

// Kategoriya uchun interfeys
export interface Category {
  id: string;
  name: string;
  description?: string;
}

// Kitob uchun interfeys
export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverImage?: string;
  status: BookStatus;
  category: Category;
  // ...kelajakda kerak bo'lishi mumkin bo'lgan boshqa maydonlar
}

// Izoh uchun interfeys
export interface Comment {
  id: string;
  comment: string;
  rating?: number;
  createdAt: string; // JSON'da sana matn ko'rinishida keladi
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// Ijara uchun interfeys

export interface Loan {
  id: string;
  bookId: string;
  userId: string;
  status: LoanStatus;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  renewalRequested: boolean; // <-- QO'SHILDI
  book: {
    id: string;
    title: string;
  };
  user: {
    // <-- QO'SHILDI (Kutubxonachi uchun)
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

// API'dan keladigan paginatsiyali javob uchun umumiy tip
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
