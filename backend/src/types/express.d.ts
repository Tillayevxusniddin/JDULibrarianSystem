declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: string;
        role: string; // Role o'rniga string ishlatamiz
      };
      validatedData?: {
        body?: any;
        query?: any;
        params?: any;
      };
    }
  }
}

// Bu fayl modulga aylanib qolmasligi uchun kerak
export {};
