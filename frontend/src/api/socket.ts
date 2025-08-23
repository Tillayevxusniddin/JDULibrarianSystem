// frontend/src/api/socket.ts
import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(URL!, {
  autoConnect: true, // AUTO CONNECT qilish
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Debug uchun
socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('🔥 Socket connection error:', error);
});
