// src/pages/librarian/CategoriesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api';
import type { Category } from '../../types';
import CategoryFormModal from '../../components/categories/CategoryFormModal';
import toast from 'react-hot-toast';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<Category[]>('/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error("Kategoriyalarni yuklashda xatolik yuz berdi.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenModal = (category: Category | null = null) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };
  
  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchCategories();
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await api.delete(`/categories/${categoryToDelete.id}`);
      toast.success(`"${categoryToDelete.name}" kategoriyasi muvaffaqiyatli o'chirildi.`);
      setDeleteConfirmOpen(false);
      fetchCategories();
    } catch (error: any) {
      const message = error.response?.data?.message || "Kategoriyani o'chirishda xatolik yuz berdi.";
      toast.error(message);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Kategoriyalar</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Yangi Kategoriya
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', px: 7 }}>Nomi</TableCell>
                <TableCell sx={{ fontWeight: 'bold', px: 7  }}>Tavsifi</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', px: 9  }}>Harakatlar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id} hover>
                  <TableCell sx={{ px: 7 }}>{cat.name}</TableCell>
                  <TableCell sx={{ px: 7 }}>{cat.description || '—'}</TableCell>
                  <TableCell sx={{ px: 9 }} align="right">
                    <IconButton onClick={() => handleOpenModal(cat)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDeleteClick(cat)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <CategoryFormModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} category={selectedCategory} />
      
      <Dialog open={isDeleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Haqiqatan ham <strong>"{categoryToDelete?.name}"</strong> kategoriyasini o'chirmoqchimisiz? Bu amalni orqaga qaytarib bo'lmaydi.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleConfirmDelete} color="error">O'chirish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesPage;
