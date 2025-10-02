// frontend/src/store/auth.store.ts
import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import type { User } from '../types';
import { useNotificationStore } from './notification.store';
import { socket } from '../api/socket';
import toast from 'react-hot-toast';

interface TokenPayload {
  id: string;
  role: User['role'];
}

interface AuthState {
  token: string | null;
  user: User | null;
  userUpdateVersion: number;
  login: (token: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUserState: (data: Partial<User>) => void;
  refreshUserData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  userUpdateVersion: 0,

  login: async (token) => {
    useNotificationStore.getState().clearNotifications();
    localStorage.setItem('authToken', token);
    set({ token });

    try {
      const response = await api.get<User>('/auth/me');
      const userData = response.data;
      set({ user: userData });

      // ✅ O'ZGARISH: Socketni shu yerda ishga tushiramiz
      if (socket.disconnected) {
        socket.auth = { token };
        socket.connect();
      }
      // -------------------------------------------------

      console.log('🏠 Joined personal room:', userData.id);

      // Bildirishnomalarni yuklash
      useNotificationStore.getState().fetchNotifications();
    } catch (error) {
      localStorage.removeItem('authToken');
      console.error('Login failed after setting token:', error);
      set({ token: null, user: null });
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    set({ token: null, user: null });
    useNotificationStore.getState().clearNotifications();
    socket.disconnect(); // ✅ socketni uzamiz
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
        const userData = response.data;
        set({ user: userData });

        // ✅ O'ZGARISH: Socketni bu yerda ham ishga tushiramiz
        if (socket.disconnected) {
          socket.auth = { token };
          socket.connect();
        }
        // -----------------------------------------------

        console.log('🏠 Rejoined personal room:', userData.id);

        // Bildirishnomalarni yuklash
        useNotificationStore.getState().fetchNotifications();
      } catch (error) {
        console.log(error);
        get().logout();
      }
    } else {
      if (get().user || get().token) {
        get().logout();
      }
    }
  },

  updateUserState: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
      userUpdateVersion: state.userUpdateVersion + 1,
    }));
  },

  refreshUserData: async () => {
    const token = get().token;
    if (token) {
      try {
        const response = await api.get<User>('/auth/me');
        set({ user: response.data });
        console.log('✅ User data refreshed successfully');
      } catch (error) {
        console.error('❌ Failed to refresh user data:', error);
      }
    }
  },
}));

// Socket event handlers
let eventHandlersRegistered = false;

const registerSocketHandlers = () => {
  if (eventHandlersRegistered) return;
  eventHandlersRegistered = true;

  console.log('🔧 Registering socket event handlers...');

  socket.on('new_notification', (newNotification) => {
    console.log('📢 New notification received:', newNotification);
    useNotificationStore.getState().addNotification(newNotification);
    useAuthStore.getState().checkAuth();
  });

  socket.on(
    'premium_status_changed',
    (data: { isPremium: boolean; message: string }) => {
      console.log('💎 Premium status changed:', data);
      useAuthStore.getState().updateUserState({ isPremium: data.isPremium });
      toast.success(data.message);
    },
  );

  socket.on('refetch_auth', (data: { reason: string }) => {
    console.log('🔄 Refetch auth requested:', data.reason);
    useAuthStore.getState().refreshUserData();
  });

  socket.on('refetch_notifications', () => {
    console.log('🔔 Refetch notifications requested');
    useNotificationStore.getState().fetchNotifications();
  });
};

socket.on('connect', () => {
  registerSocketHandlers();
});
