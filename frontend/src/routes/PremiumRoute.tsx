import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

const PremiumRoute: React.FC = () => {
  const { user } = useAuthStore();

  if (user && user.isPremium) {
    return <Outlet />;
  }

  // Agar premium bo'lmasa, asosiy sahifaga qaytaramiz
  return <Navigate to="/" replace />;
};

export default PremiumRoute;
