import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

const LibrarianRoute: React.FC = () => {
  const { user } = useAuthStore();

  // Foydalanuvchi tizimga kirgan va uning roli LIBRARIAN bo'lsa,
  // so'ralgan sahifani ko'rsatamiz.
  if (user && user.role === 'LIBRARIAN') {
    return <Outlet />;
  }

  // Aks holda, asosiy sahifaga qaytaramiz (yoki "Ruxsat yo'q" sahifasiga).
  return <Navigate to="/" replace />;
};

export default LibrarianRoute;
