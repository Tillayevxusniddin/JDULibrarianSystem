import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import MainLayout from '../components/layout/MainLayout'; // <-- Layout'ni import qilamiz

const ProtectedRoute: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Endi shunchaki Outlet emas, balki to'liq Layout'ni qaytaramiz
  return <MainLayout />;
};

export default ProtectedRoute;