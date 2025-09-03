import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, TextField, Button, CircularProgress, List, ListItem, ListItemText, ListItemAvatar, Avatar, ListItemButton, Pagination } from '@mui/material';
import api from '../../api';
import type { User, PaginatedResponse } from '../../types';
import toast from 'react-hot-toast';
import { useDebounce } from 'use-debounce';

const ManualFinesPage: React.FC = () => {
  // Foydalanuvchilar ro'yxati uchun state'lar
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch] = useDebounce(userSearch, 500);
  const [userPage, setUserPage] = useState(1);
  const [totalUserPages, setTotalUserPages] = useState(1);
  const [usersLoading, setUsersLoading] = useState(true);

  // --- OLIB TASHLANDI: Kerak bo'lmagan kitob qidirish state'lari ---
  // const [bookSearch, setBookSearch] = useState('');
  // const [debouncedBookSearch] = useDebounce(bookSearch, 500);
  // const [bookOptions, setBookOptions] = useState<Book[]>([]);
  
  // Forma uchun state'lar
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);

  // Foydalanuvchilarni paginatsiya va qidiruv bilan yuklash
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const response = await api.get<PaginatedResponse<User>>('/users', {
        params: { page: userPage, limit: 15, search: debouncedUserSearch || undefined },
      });
      setUsers(response.data.data);
      setTotalUserPages(response.data.meta.totalPages);
    } catch (error) {
      toast.error('Foydalanuvchilarni yuklashda xatolik yuz berdi.');
    } finally {
      setUsersLoading(false);
    }
  }, [userPage, debouncedUserSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Qidiruv o'zgarganda birinchi sahifaga qaytish
  useEffect(() => {
    setUserPage(1);
  }, [debouncedUserSearch]);

  // --- OLIB TASHLANDI: Kerak bo'lmagan kitoblarni qidirish uchun useEffect ---
  // useEffect(() => { ... }, [debouncedBookSearch]);

  const handleSubmit = async () => {
    if (!selectedUser || !barcode || !amount || !reason) {
      toast.error('Barcha maydonlarni to`ldiring!');
      return;
    }
    setLoading(true);
    try {
        await api.post('/fines/manual', {
            userId: selectedUser.id,
            barcode: barcode,
            amount: Number(amount),
            reason
        });
        toast.success('Jarima muvaffaqiyatli qo`shildi!');
        // Formani tozalash
        setSelectedUser(null);
        setBarcode('');
        setAmount('');
        setReason('');
    } catch (error: any) {
      const message = error.response?.data?.message || "Jarima yaratishda xatolik yuz berdi.";
      toast.error(message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Qo'lda Jarima Yaratish
      </Typography>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Foydalanuvchilar ro'yxati (o'zgarishsiz) */}
        <div className="md:col-span-4">
          <Paper sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2, px: 1 }}>1. Foydalanuvchini tanlang</Typography>
            <TextField label="Foydalanuvchini qidirish..." variant="outlined" size="small" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} sx={{ mb: 2 }} />
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {usersLoading ? <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} /> : (
                <List>
                  {users.map(user => (
                    <ListItem key={user.id} disablePadding>
                        <ListItemButton selected={selectedUser?.id === user.id} onClick={() => setSelectedUser(user)}>
                          <ListItemAvatar>
                            <Avatar src={user.profilePicture ? `http://localhost:5000${user.profilePicture}` : undefined}>
                                {user.firstName.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText primary={`${user.firstName} ${user.lastName}`} secondary={user.email} />
                        </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
            {totalUserPages > 1 && (
              <Pagination count={totalUserPages} page={userPage} onChange={(_, value) => setUserPage(value)} sx={{ mt: 2, display: 'flex', justifyContent: 'center' }} />
            )}
          </Paper>
        </div>

        {/* Jarima formasi (o'zgarishsiz) */}
        <div className="md:col-span-8">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              2. Jarima ma'lumotlarini kiriting {selectedUser && `uchun: ${selectedUser.firstName}`}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: selectedUser ? 1 : 0.5, transition: 'opacity 0.3s' }}>
              <TextField 
                disabled={!selectedUser}
                label="Kitob nusxasining shtrix-kodi" 
                variant="outlined"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                required
              />
              <TextField 
                disabled={!selectedUser}
                label="Jarima miqdori (so'mda)" 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <TextField 
                disabled={!selectedUser}
                label="Sababi (masalan, 'Kitobni yo'qotib qo`ydi')" 
                multiline 
                rows={4} 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <Button 
                variant="contained" 
                color="error"
                onClick={handleSubmit} 
                disabled={loading || !selectedUser || !barcode}
              >
                {loading ? <CircularProgress size={24} /> : "Jarima Yaratish"}
              </Button>
            </Box>
          </Paper>
        </div>
      </div>
    </Box>
  );
};

export default ManualFinesPage;
