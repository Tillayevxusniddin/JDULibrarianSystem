/**
 * Loyihadagi barcha "sehrli raqamlar" va "qattiq kodlangan satrlar"
 * uchun markazlashtirilgan manba. Bu kodni boshqarishni va o'zgartirishni osonlashtiradi.
 */
import { BookCopyStatus, LoanStatus, ReservationStatus } from '@prisma/client';

// Fayl yo'llari
export const DEFAULT_BOOK_COVER =
  'https://library-system-assets.s3.ap-northeast-1.amazonaws.com/uploads/books/default.png';
export const DEFAULT_AVATAR =
  'https://library-system-assets.s3.ap-northeast-1.amazonaws.com/uploads/avatars/default.png';
export const DEFAULT_CHANNEL_LOGO =
  'https://library-system-assets.s3.ap-northeast-1.amazonaws.com/uploads/logos/default.png';

// Kutubxona qoidalari
export const BORROWING_LIMIT = 3; // Bir foydalanuvchi bir vaqtda nechta kitob olishi mumkin
export const LOAN_DURATION_DAYS = 14; // Ijaraning standart muddati (kunlarda)
export const RENEWAL_DURATION_DAYS = 14; // Muddatni uzaytirish muddati (kunlarda)
// COMMENTED OUT - Reservation feature disabled
// export const RESERVATION_PICKUP_HOURS = 48; // Band qilingan kitobni olib ketish muddati (soatlarda)

// Jarimalar
export const FINE_AMOUNT = 5000; // Muddati o'tgan kitob uchun standart jarima miqdori

// Pagination (Sahifalash)
export const DEFAULT_PAGE_NUMBER = 1;
export const DEFAULT_PAGE_LIMIT = 10;
export const MAX_PAGE_LIMIT = 100;

// Kesh sozlamalari
export const CACHE_TTL_SECONDS = 3600; // Keshda ma'lumot saqlash vaqti (1 soat)

// Tizim statuslari (enum'lardan olingan, lekin qulaylik uchun)
export const BOOK_STATUS = BookCopyStatus;
export const LOAN_STATUS = LoanStatus;
export const RESERVATION_STATUS = ReservationStatus;
