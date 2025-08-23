import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

const ManagerRoute: React.FC = () => {
  const { user } = useAuthStore();

  // Foydalanuvchi tizimga kirgan va uning roli MANAGER bo'lsa,
  // so'ralgan sahifani ko'rsatamiz.
  if (user && user.role === 'MANAGER') {
    return <Outlet />;
  }

  // Aks holda, asosiy sahifaga qaytaramiz.
  return <Navigate to="/" replace />;
};

export default ManagerRoute;
