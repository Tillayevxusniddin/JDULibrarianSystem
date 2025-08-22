import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Autocomplete, TextField, Button, CircularProgress, List, ListItem, ListItemText, ListItemAvatar, Avatar, ListItemButton, Pagination } from '@mui/material';
import api from '../../api';
import type { User, Book, PaginatedResponse } from '../../types';
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

  // Kitoblar uchun state'lar
  const [bookSearch, setBookSearch] = useState('');
  const [debouncedBookSearch] = useDebounce(bookSearch, 500);
  const [bookOptions, setBookOptions] = useState<Book[]>([]);
  
  // Forma uchun state'lar
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
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

  // Kitoblarni qidirish
  useEffect(() => {
    if (debouncedBookSearch.length > 2) {
      api.get<PaginatedResponse<Book>>(`/books?search=${debouncedBookSearch}&limit=10`).then(res => setBookOptions(res.data.data));
    } else {
      setBookOptions([]);
    }
  }, [debouncedBookSearch]);

  const handleSubmit = async () => {
    if (!selectedUser || !selectedBook || !amount || !reason) {
      toast.error('Barcha maydonlarni to`ldiring!');
      return;
    }
    setLoading(true);
    try {
        await api.post('/fines/manual', {
            userId: selectedUser.id,
            bookId: selectedBook.id,
            amount: Number(amount),
            reason
        });
        toast.success('Jarima muvaffaqiyatli qo`shildi!');
        setSelectedUser(null);
        setSelectedBook(null);
        setAmount('');
        setReason('');
        setBookSearch('');
    } catch (error: any) {
      const message = error.response?.data?.message || "Jarima yaratishda xatolik yuz berdi.";
      toast.error(message);
    } finally {
        setLoading(false);
    }
  };
  
  // Qidiruv o'zgarganda birinchi sahifaga qaytish
  useEffect(() => {
    setUserPage(1);
  }, [debouncedUserSearch]);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Qo'lda Jarima Yaratish va Kitob Statusini O'zgartirish
      </Typography>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Foydalanuvchilar ro'yxati */}
        <div className="md:col-span-4">
          <Paper sx={{ p: 2, borderRadius: 4, height: '70vh', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2, px: 1 }}>1. Foydalanuvchini tanlang</Typography>
            <TextField label="Foydalanuvchini qidirish..." variant="outlined" size="small" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} sx={{ mb: 2 }} />
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {usersLoading ? <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} /> : (
                <List>
                  {users.map(user => (
                    <ListItem key={user.id} disablePadding>
                        <ListItemButton selected={selectedUser?.id === user.id} onClick={() => setSelectedUser(user)}>
                          <ListItemAvatar>
                            <Avatar src={user.profilePicture ? `http://localhost:5000/public${user.profilePicture}` : undefined}>
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

        {/* Jarima formasi */}
        <div className="md:col-span-8">
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              2. Jarima ma'lumotlarini kiriting {selectedUser && `uchun: ${selectedUser.firstName}`}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: selectedUser ? 1 : 0.5, transition: 'opacity 0.3s' }}>
              <Autocomplete
                disabled={!selectedUser}
                options={bookOptions}
                getOptionLabel={(option) => `${option.title} - ${option.author}`}
                value={selectedBook}
                inputValue={bookSearch}
                onInputChange={(_, newValue) => setBookSearch(newValue)}
                onChange={(_, newValue) => setSelectedBook(newValue)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => <TextField {...params} label="Yo'qolgan kitobni qidiring" />}
              />
              <TextField 
                disabled={!selectedUser}
                label="Jarima miqdori (so'mda)" 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
              />
              <TextField 
                disabled={!selectedUser}
                label="Sababi (masalan, 'Kitobni yo'qotib qo`ydi')" 
                multiline 
                rows={4} 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
              />
              <Button 
                variant="contained" 
                color="error"
                onClick={handleSubmit} 
                disabled={loading || !selectedUser || !selectedBook}
              >
                {loading ? <CircularProgress size={24} /> : "Jarima Yaratish va Kitobni Muzlatish"}
              </Button>
            </Box>
          </Paper>
        </div>
      </div>
    </Box>
  );
};

export default ManualFinesPage;
