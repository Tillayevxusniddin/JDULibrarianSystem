// src/components/users/UserFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Box } from '@mui/material';
import api from '../../api';
import type { User, UserRole } from '../../types';
import toast from 'react-hot-toast';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ open, onClose, onSuccess, user }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'USER' as UserRole,
  });
  const [loading, setLoading] = useState(false);
  const isEditing = user !== null;

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'USER' });
    }
  }, [user, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name!]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isEditing) {
        const { password, ...updateData } = formData;
        await api.put(`/users/${user.id}`, updateData);
        toast.success('Foydalanuvchi ma`lumotlari yangilandi!');
      } else {
        await api.post('/users', formData);
        toast.success('Foydalanuvchi muvaffaqiyatli yaratildi!');
      }
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.message || "Foydalanuvchini saqlashda xatolik yuz berdi.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
        {isEditing ? <EditIcon /> : <PersonAddIcon />}
        {isEditing ? "Foydalanuvchini Tahrirlash" : "Yangi Foydalanuvchi Qo'shish"}
      </DialogTitle>
      <DialogContent sx={{ bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Ism" name="firstName" value={formData.firstName} onChange={handleChange} fullWidth />
          <TextField label="Familiya" name="lastName" value={formData.lastName} onChange={handleChange} fullWidth />
          <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} fullWidth disabled={isEditing} />
          {!isEditing && (
            <TextField label="Parol" name="password" type="password" value={formData.password} onChange={handleChange} fullWidth />
          )}
          <FormControl fullWidth>
            <InputLabel>Roli</InputLabel>
            <Select name="role" value={formData.role} label="Roli" onChange={handleChange as any}>
              <MenuItem value="USER">USER</MenuItem>
              <MenuItem value="LIBRARIAN">LIBRARIAN</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: (t) => t.spacing(2, 3) }}>
        <Button onClick={onClose}>Bekor qilish</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Saqlash'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserFormModal;
