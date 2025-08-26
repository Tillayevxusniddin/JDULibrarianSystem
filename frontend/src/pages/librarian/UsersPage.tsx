import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Paper, InputBase, IconButton, Pagination } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import api from '../../api';
import type { User, PaginatedResponse } from '../../types';
import UsersTable from '../../components/users/UsersTable';
import UserFormModal from '../../components/users/UserFormModal';
import BulkUserUploadModal from '../../components/users/BulkUserUploadModal';
import toast from 'react-hot-toast';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- PAGINATSIYA VA QIDIRUV UCHUN STATE'LAR ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isBulkModalOpen, setBulkModalOpen] = useState(false); 
  const [isSyncing, setIsSyncing] = useState(false);

  // Qidiruv uchun "debounce" effekti
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Qidiruv o'zgarganda birinchi sahifaga o'tish
    }, 500); // Foydalanuvchi yozishni to'xtatgandan 500ms keyin ishlaydi
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<PaginatedResponse<User>>('/users', {
        params: { page, limit: 10, search: debouncedSearchTerm || undefined },
      });
      setUsers(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (err) {
      const errorMessage = 'Foydalanuvchilarni yuklashda xatolik yuz berdi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchTerm]);

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

  const handleSyncFromKintone = async () => {
    try {
      setIsSyncing(true);
      const res = await api.post('/kintone/sync-students');
      const r = res.data?.result;
      toast.success(
        `Kintone sync: created ${r?.created ?? 0}, updated ${r?.updated ?? 0}, skipped ${r?.skipped ?? 0}.`,
      );
      fetchUsers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Kintone bilan sinxronlashtirishda xatolik.';
      toast.error(message);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading && users.length === 0) return <CircularProgress />;
  if (error && users.length === 0) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Foydalanuvchilar
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={handleSyncFromKintone} disabled={isSyncing}>
            {isSyncing ? 'Sinxronizatsiya...' : 'Kintone bilan sinx'}
          </Button>
          <Button variant="outlined" startIcon={<GroupAddIcon />} onClick={() => setBulkModalOpen(true)}>
            Ommaviy Qo'shish
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
            Yangi Foydalanuvchi
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: { xs: '100%', md: 400 }, mb: 3, borderRadius: '12px' }}>
        <InputBase sx={{ ml: 1, flex: 1 }} placeholder="Foydalanuvchilarni qidirish..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
      </Paper>
      
      <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <UsersTable users={users} onEdit={handleOpenModal} onDelete={handleDeleteClick} />
      </Paper>
      
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} color="primary" />
        </Box>
      )}
      
      <UserFormModal open={isModalOpen} onClose={handleCloseModal} onSuccess={handleSuccess} user={selectedUser} />
      <BulkUserUploadModal
        open={isBulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSuccess={() => { setBulkModalOpen(false); fetchUsers(); }}
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
