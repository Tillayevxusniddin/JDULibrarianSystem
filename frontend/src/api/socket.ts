import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SOCKET_URL!;

export const socket = io(URL, {
  // Avtomatik ulanishni o'chirib qo'yamiz. Faqat login qilgandan keyin o'zimiz ulaymiz.
  autoConnect: false,

  // Har bir ulanish urinishida "auth" funksiyasi ishga tushadi
  // va tokenni olib, serverga yuboradi.
  auth: (cb) => {
    cb({
      token: localStorage.getItem('authToken'),
    });
  },
});

socket.on('connect', () => {
  console.log('✅ Socket connected with token:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  // Eng muhim xatoliklardan biri
  console.error('🔥 Socket connection error:', error.message);
});
