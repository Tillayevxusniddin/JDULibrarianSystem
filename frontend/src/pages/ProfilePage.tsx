// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress, Divider } from '@mui/material';
import { useAuthStore } from '../store/auth.store';
import api from '../api';
import type { User } from '../types';
import toast from 'react-hot-toast';
import ChangePasswordModal from '../components/profile/ChangePasswordModal';
import ProfileAvatar from '../components/profile/ProfileAvatar'; // Yangi komponentni import qilamiz
import { motion } from 'framer-motion';

const ProfilePage: React.FC = () => {
  const { user, updateUserState } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); 

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put<{ data: User }>('/auth/me', formData);
      updateUserState(response.data.data);
      toast.success('Ma`lumotlaringiz muvaffaqiyatli saqlandi!');
    } catch (error: any) {
      const message = error.response?.data?.message || "Profilni saqlashda xatolik yuz berdi.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <CircularProgress />;
  }

  return (
    <>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
          Mening Profilim
        </Typography>
        
        {/* Tailwind Grid Container */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-8">
          {/* Chap taraf: Rasm va umumiy ma'lumot - 4 kolonka */}
          <div className="md:col-span-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <ProfileAvatar />
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography color="text.secondary">{user.email}</Typography>
              </Paper>
            </motion.div>
          </div>
          
          {/* O'ng taraf: Sozlamalar - 8 kolonka */}
          <div className="md:col-span-8">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Shaxsiy ma'lumotlar</Typography>
                  <TextField label="Ism" name="firstName" value={formData.firstName} onChange={handleChange} fullWidth />
                  <TextField label="Familiya" name="lastName" value={formData.lastName} onChange={handleChange} fullWidth />
                  <Button type="submit" variant="contained" disabled={loading} sx={{ mt: 2 }}>
                    {loading ? <CircularProgress size={24} /> : 'Ma`lumotlarni Saqlash'}
                  </Button>
                </form>
                <Divider sx={{ my: 4 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Xavfsizlik</Typography>
                  <Button variant="outlined" onClick={() => setIsModalOpen(true)} sx={{ mt: 2 }}>
                    Parolni O'zgartirish
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          </div>
        </div>
      </Box>
      <ChangePasswordModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default ProfilePage;
