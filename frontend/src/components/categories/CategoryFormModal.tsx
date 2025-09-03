// src/components/categories/CategoryFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';
import api from '../../api';
import type { Category } from '../../types';
import toast from 'react-hot-toast';
import CategoryIcon from '@mui/icons-material/Category';

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: Category | null;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ open, onClose, onSuccess, category }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const isEditing = category !== null;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [category, open]);

  const handleSubmit = async () => {
    try {
      const payload = { name, description };
      if (isEditing) {
        await api.put(`/categories/${category.id}`, payload);
        toast.success('Kategoriya muvaffaqiyatli yangilandi!');
      } else {
        await api.post('/categories', payload);
        toast.success('Kategoriya muvaffaqiyatli yaratildi!');
      }
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.message || "Kategoriyani saqlashda xatolik yuz berdi.";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
        <CategoryIcon />
        {isEditing ? "Kategoriyani Tahrirlash" : "Yangi Kategoriya Qo'shish"}
      </DialogTitle>
      <DialogContent sx={{ bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Nomi" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="Tavsifi (Ixtiyoriy)" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={3} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: (t) => t.spacing(2, 3) }}>
        <Button onClick={onClose}>Bekor qilish</Button>
        <Button onClick={handleSubmit} variant="contained">Saqlash</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryFormModal;
