// src/components/profile/ProfileAvatar.tsx
import React, { useState, useRef } from 'react';
import { Avatar, Box, IconButton, CircularProgress } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useAuthStore } from '../../store/auth.store';
import api from '../../api';
import toast from 'react-hot-toast';

const ProfileAvatar: React.FC = () => {
  const { user, updateUserState } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);
    setLoading(true);

    try {
      const response = await api.put('/auth/me/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUserState(response.data.data);
      toast.success('Profil rasmi muvaffaqiyatli yangilandi!');
    } catch (error) {
      toast.error("Rasmni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // --- YECHIM SHU YERDA ---
  // Backenddan kelayotgan rasm yo'li '/uploads/...' ko'rinishida bo'lgani uchun,
  // uning oldiga serverdagi statik papka nomini (`/public`) qo'shamiz.
  const avatarUrl = user?.profilePicture 
    ? `http://localhost:5000/public${user.profilePicture}` 
    : undefined;
  // --- YECHIM TUGADI ---

  return (
    <Box sx={{ position: 'relative', width: 150, height: 150, margin: 'auto' }}>
      <Avatar
        src={avatarUrl}
        sx={{
          width: 150,
          height: 150,
          fontSize: '4rem',
          border: '4px solid',
          borderColor: 'primary.main',
        }}
      >
        {user?.firstName.charAt(0)}
      </Avatar>
      <IconButton
        onClick={handleAvatarClick}
        sx={{
          position: 'absolute',
          bottom: 5,
          right: 5,
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'background.default' },
          border: '2px solid',
          borderColor: 'primary.light'
        }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : <PhotoCameraIcon />}
      </IconButton>
      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept="image/png, image/jpeg"
        onChange={handleFileChange}
      />
    </Box>
  );
};

export default ProfileAvatar;
