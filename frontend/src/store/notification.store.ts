import { create } from 'zustand';
import api from '../api';
import type { Notification } from '../types';
import { socket } from '../api/socket';
import toast from 'react-hot-toast';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markOneAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  addNotification: (notification: Notification) => void;
  deleteNotification: (id: string) => Promise<void>;
  deleteRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const response = await api.get<Notification[]>('/notifications');
      const notifications = response.data;
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ notifications, unreadCount, loading: false });
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      set({ loading: false });
    }
  },

  markOneAsRead: async (id: string) => {
    const alreadyRead = get().notifications.find((n) => n.id === id)?.isRead;
    if (alreadyRead) return;

    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: state.unreadCount > 0 ? state.unreadCount - 1 : 0,
    }));
    try {
      await api.post(`/notifications/${id}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read', error);
      get().fetchNotifications();
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await api.post('/notifications/read-all');
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
      get().fetchNotifications();
    }
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0, loading: false });
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  deleteNotification: async (id: string) => {
    const originalState = get();
    const notificationToDelete = originalState.notifications.find(
      (n) => n.id === id,
    );

    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount:
        notificationToDelete && !notificationToDelete.isRead
          ? state.unreadCount - 1
          : state.unreadCount,
    }));
    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.log(error);
      toast.error("Bildirishnomani o'chirishda xatolik yuz berdi.");
      set(originalState);
    }
  },

  deleteRead: async () => {
    const originalState = get();
    set((state) => ({
      notifications: state.notifications.filter((n) => !n.isRead),
    }));
    try {
      await api.delete('/notifications/read');
    } catch (error) {
      console.log(error);
      toast.error("O'qilgan bildirishnomalarni o'chirishda xatolik yuz berdi.");
      set(originalState);
    }
  },
}));

// --- SOCKET HODISALARINI TINGLASH ---

socket.on('new_notification', (newNotification: Notification) => {
  console.log('New notification received via socket:', newNotification);
  useNotificationStore.getState().addNotification(newNotification);
});

socket.on('refetch_notifications', () => {
  console.log('Refetch signal received from server via socket.');
  useNotificationStore.getState().fetchNotifications();
});
