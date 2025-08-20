// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Alert, CircularProgress, Box, Paper, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import api from '../api';
import { useAuthStore } from '../store/auth.store';
import SchoolIcon from '@mui/icons-material/School';
import toast from 'react-hot-toast';

// Orqa fon uchun chiroyli gradient
const backgroundStyle = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  overflow: 'hidden',
  background: `radial-gradient(circle at 10% 20%, rgb(215, 227, 255) 0%, rgb(240, 243, 250) 90.2%)`,
  zIndex: -1,
};

const darkBackgroundStyle = {
    ...backgroundStyle,
    background: `radial-gradient(circle at 10% 20%, rgb(18, 24, 40) 0%, rgb(30, 30, 63) 90.2%)`,
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      await login(response.data.token);
      toast.success('Tizimga muvaffaqiyatli kirildi!');
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Tizimga kirishda xatolik yuz berdi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        position: 'relative',
        padding: 2,
    }}>
      <Box sx={(theme) => (theme.palette.mode === 'dark' ? darkBackgroundStyle : backgroundStyle)} />
      
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <Paper elevation={10} sx={{ padding: { xs: 3, sm: 5 }, width: '100%', maxWidth: '420px', borderRadius: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
            >
              <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 64, height: 64 }}>
                <SchoolIcon sx={{ fontSize: 40 }} />
              </Avatar>
            </motion.div>
            <Typography component="h1" variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
              Kutubxona Tizimi
            </Typography>
          </Box>
          
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            </motion.div>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Manzil"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Parol"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Kirish'}
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default LoginPage;
