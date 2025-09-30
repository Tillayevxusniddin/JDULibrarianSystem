import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { Box, CircularProgress, Typography } from '@mui/material';
import toast from 'react-hot-toast';

const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error("Google orqali kirishda xatolik yuz berdi.");
      navigate('/login');
      return;
    }

    if (token) {
      // Tokenni store'ga saqlaymiz va asosiy sahifaga o'tamiz
      login(token).then(() => {
        toast.success('Tizimga muvaffaqiyatli kirdingiz!');
        navigate('/');
      });
    } else {
        // Agar token bo'lmasa, login sahifasiga qaytaramiz
        toast.error("Autentifikatsiya ma'lumotlari topilmadi.");
        navigate('/login');
    }
  }, [searchParams, navigate, login]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Iltimos, kuting...</Typography>
    </Box>
  );
};

export default GoogleCallbackPage;