import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from '../store/auth.store';
import MainLayout from '../components/layout/MainLayout'; // <-- Layout'ni import qilamiz

const ProtectedRoute: React.FC = () => {
  const { user } = useAuthStore();
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('authToken');

  // If we have a token but the user isn't loaded yet (on refresh),
  // render a lightweight loader instead of redirecting.
  if (hasToken && !user) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Endi shunchaki Outlet emas, balki to'liq Layout'ni qaytaramiz
  return <MainLayout />;
};

export default ProtectedRoute;
