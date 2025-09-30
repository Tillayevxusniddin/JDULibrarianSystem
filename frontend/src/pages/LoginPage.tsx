import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Alert, CircularProgress, Box, Paper, Avatar, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import api from '../api';
import { useAuthStore } from '../store/auth.store';
import SchoolIcon from '@mui/icons-material/School';
import toast from 'react-hot-toast';
import GoogleIcon from '@mui/icons-material/Google';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      await login(response.data.token);
      toast.success('Tizimga muvaffaqiyatli kirildi!');
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Email yoki parol noto\'g\'ri.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginClick = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: `radial-gradient(circle at 10% 20%, rgb(215, 227, 255) 0%, rgb(240, 243, 250) 90.2%)`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          elevation={8}
          sx={{ 
            p: { xs: 3, sm: 5 }, 
            width: '100%', 
            maxWidth: 420, 
            borderRadius: 4,
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
              <SchoolIcon />
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
              Kutubxona Tizimi
            </Typography>
          </Box>
          
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
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
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Kirish'}
            </Button>
            
            <Divider sx={{ my: 2 }}>YOKI</Divider>
            
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLoginClick}
              sx={{ borderRadius: 2 }}
            >
              Google orqali kirish
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default LoginPage;