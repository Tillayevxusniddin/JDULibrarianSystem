import { Role } from '@prisma/client';

// Foydalanuvchi autentifikatsiyadan o'tgandan keyin
// req.user obyekti qanday ko'rinishda bo'lishini tasvirlaydi.
export interface AuthenticatedUser {
  id: string;
  role: Role;
}

declare global {
  namespace Express {
    export interface Request {
      // Endi butun loyiha bo'ylab req.user faqat shu ko'rinishda bo'ladi
      user?: AuthenticatedUser;

      validatedData?: {
        body?: any;
        query?: any;
        params?: any;
      };
    }

    // Passport.js kutubxonasi uchun ham User tipini kengaytiramiz
    export interface User extends AuthenticatedUser {}
  }
}

// Bu fayl modulga aylanib qolmasligi uchun kerak
export {};
