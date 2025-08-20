import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import type { User } from '../types';
import { useNotificationStore } from './notification.store'; // Boshqa store'ni import qilish

interface TokenPayload {
  id: string;
  role: User['role'];
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUserState: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,

  login: async (token) => {
    // Yangi foydalanuvchi kirishidan oldin eski bildirishnomalarni tozalash
    useNotificationStore.getState().clearNotifications();

    localStorage.setItem('authToken', token);
    set({ token });
    try {
      const response = await api.get<User>('/auth/me');
      set({ user: response.data });
    } catch (error) {
      localStorage.removeItem('authToken');
      console.error('Login failed after setting token:', error);
      set({ token: null, user: null });
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    set({ token: null, user: null });

    // Eng muhim qism: Boshqa store'lardagi foydalanuvchiga oid ma'lumotlarni ham tozalash
    useNotificationStore.getState().clearNotifications();
    // Kelajakda boshqa store'lar qo'shilsa (masalan, myLoansStore), ularni ham shu yerda tozalash kerak
  },

  checkAuth: async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload & { exp: number }>(token);
        if (decoded.exp * 1000 < Date.now()) {
          throw new Error('Token expired');
        }
        set({ token });
        const response = await api.get<User>('/auth/me');
        set({ user: response.data });
      } catch (error) {
        console.log(error);
        // Agar biror xatolik bo'lsa, to'liq logout qilamiz
        get().logout();
      }
    } else {
      // Agar token bo'lmasa, lekin state'da eski ma'lumot qolgan bo'lsa, uni ham tozalaymiz
      if (get().user || get().token) {
        get().logout();
      }
    }
  },

  updateUserState: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },
}));
