// src/components/profile/ChangePasswordModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Box } from '@mui/material';
import api from '../../api';
import toast from 'react-hot-toast';
import LockResetIcon from '@mui/icons-material/LockReset';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Oyna yopilganda maydonlarni tozalash
  useEffect(() => {
    if (!open) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Yangi parollar mos kelmadi.");
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword });
      toast.success('Parol muvaffaqiyatli o`zgartirildi!');
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.message || "Parolni o'zgartirishda xatolik yuz berdi.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
        <LockResetIcon />
        Parolni O'zgartirish
      </DialogTitle>
      <DialogContent sx={{ bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField 
            label="Joriy Parol" 
            type="password" 
            fullWidth 
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField 
            label="Yangi Parol" 
            type="password" 
            fullWidth 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField 
            label="Yangi Parolni Tasdiqlang" 
            type="password" 
            fullWidth 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: (t) => t.spacing(2, 3) }}>
        <Button onClick={onClose}>Bekor qilish</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Tasdiqlash'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordModal;
