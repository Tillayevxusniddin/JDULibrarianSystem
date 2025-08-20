// src/pages/librarian/UsersPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Paper, InputBase, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../api';
import type { User } from '../../types';
import UsersTable from '../../components/users/UsersTable';
import UserFormModal from '../../components/users/UserFormModal';
import toast from 'react-hot-toast';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<User[]>('/users');
      setUsers(response.data);
    } catch (err) {
      const errorMessage = 'Foydalanuvchilarni yuklashda xatolik yuz berdi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user: User | null = null) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };
  
  const handleSuccess = () => {
    handleCloseModal();
    fetchUsers();
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setUserToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success(`Foydalanuvchi ${userToDelete.firstName} muvaffaqiyatli o'chirildi.`);
      handleCloseDeleteConfirm();
      fetchUsers();
    } catch (error: any) {
      const message = error.response?.data?.message || "Foydalanuvchini o'chirishda xatolik yuz berdi.";
      toast.error(message);
    }
  };

  if (loading) return <CircularProgress />;
  if (error && users.length === 0) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Foydalanuvchilar
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
        >
          Yangi Foydalanuvchi
        </Button>
      </Box>

      {/* Qidiruv va boshqa filtrlar uchun joy */}
      <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400, mb: 3, borderRadius: '12px' }}>
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Foydalanuvchilarni qidirish..."
        />
        <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
      </Paper>
      
      {/* Jadval endi chiroyliroq Paper ichida */}
      <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <UsersTable users={users} onEdit={handleOpenModal} onDelete={handleDeleteClick} />
      </Paper>
      
      <UserFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        user={selectedUser}
      />

      <Dialog open={isDeleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Haqiqatan ham <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>ni o'chirmoqchimisiz? Bu amalni orqaga qaytarib bo'lmaydi.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Bekor qilish</Button>
          <Button onClick={handleConfirmDelete} color="error">
            O'chirish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
