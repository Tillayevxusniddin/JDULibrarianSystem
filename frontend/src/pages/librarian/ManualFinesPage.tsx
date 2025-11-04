import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, TextField, Button, CircularProgress, List, ListItem, ListItemText, ListItemAvatar, Avatar, ListItemButton, Pagination, Autocomplete } from '@mui/material';
import api from '../../api';
import type { User, PaginatedResponse, Book } from '../../types';
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

  // Kitob qidirish uchun state'lar
  const [bookSearch, setBookSearch] = useState('');
  const [debouncedBookSearch] = useDebounce(bookSearch, 500);
  const [bookOptions, setBookOptions] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [booksLoading, setBooksLoading] = useState(false);
  const [bookAutocompleteOpen, setBookAutocompleteOpen] = useState(false);
  
  // Forma uchun state'lar
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
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
    } catch {
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

  // Kitoblarni qidirish yoki dastlabki kitoblarni yuklash
  useEffect(() => {
    // Agar autocomplete ochiq bo'lsa va qidiruv bo'sh bo'lsa, dastlabki kitoblarni ko'rsatamiz
    if (bookAutocompleteOpen && !debouncedBookSearch) {
      setBooksLoading(true);
      api
        .get<PaginatedResponse<Book>>('/books', {
          params: { limit: 10 },
        })
        .then((response) => setBookOptions(response.data.data))
        .catch(() => toast.error('Kitoblarni yuklashda xatolik yuz berdi.'))
        .finally(() => setBooksLoading(false));
      return;
    }

    // Qidiruv bo'lsa
    if (debouncedBookSearch.length >= 2) {
      setBooksLoading(true);
      api
        .get<PaginatedResponse<Book>>('/books', {
          params: { search: debouncedBookSearch, limit: 20 },
        })
        .then((response) => setBookOptions(response.data.data))
        .catch(() => toast.error('Kitoblarni yuklashda xatolik yuz berdi.'))
        .finally(() => setBooksLoading(false));
    } else if (!bookAutocompleteOpen) {
      // Autocomplete yopiq va qidiruv yo'q bo'lsa, ro'yxatni tozalash
      setBookOptions([]);
    }
  }, [debouncedBookSearch, bookAutocompleteOpen]);

  // Kitob tanlanganda to'liq ma'lumotlarni yuklash (nusxalar bilan)
  useEffect(() => {
    if (!selectedBook) {
      setSelectedBarcode(null);
      return;
    }
    // Agar nusxalar allaqachon yuklangan bo'lsa, qayta yuklash shart emas
    if (selectedBook.copies && selectedBook.copies.length > 0) {
      setSelectedBarcode(null);
      return;
    }
    // To'liq ma'lumotlarni yuklash
    api
      .get<Book>(`/books/${selectedBook.id}`)
      .then((response) => {
        // Tanlangan kitobni to'liq ma'lumotlar bilan yangilash
        setSelectedBook(response.data);
        setSelectedBarcode(null);
      })
      .catch(() => toast.error('Kitob ma\'lumotlarini yuklashda xatolik yuz berdi.'));
  }, [selectedBook?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!selectedUser || !selectedBarcode || !amount || !reason) {
      toast.error('Barcha maydonlarni to`ldiring!');
      return;
    }
    setLoading(true);
    try {
        await api.post('/fines/manual', {
            userId: selectedUser.id,
            barcode: selectedBarcode,
            amount: Number(amount),
            reason
        });
        toast.success('Jarima muvaffaqiyatli qo`shildi!');
        // Formani tozalash
        setSelectedUser(null);
        setSelectedBook(null);
        setSelectedBarcode(null);
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
              <Autocomplete
                disabled={!selectedUser}
                open={bookAutocompleteOpen}
                onOpen={() => setBookAutocompleteOpen(true)}
                onClose={() => setBookAutocompleteOpen(false)}
                options={bookOptions}
                getOptionLabel={(option) => `${option.title} - ${option.author || 'Muallif noma\'lum'}`}
                loading={booksLoading}
                value={selectedBook}
                onChange={(_, newValue) => setSelectedBook(newValue)}
                onInputChange={(_, newInputValue) => setBookSearch(newInputValue)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText={bookSearch.length < 2 ? "Kitob qidirish uchun kamida 2 ta harf kiriting" : "Kitob topilmadi"}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Kitobni qidiring"
                    placeholder="Kitob nomini yozing..."
                    variant="outlined"
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {booksLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              <Autocomplete
                disabled={!selectedUser || !selectedBook}
                options={
                  selectedBook && selectedBook.copies
                    ? selectedBook.copies
                        .filter((c) => c.status === 'AVAILABLE' || c.status === 'BORROWED')
                        .map((c) => c.barcode)
                    : []
                }
                value={selectedBarcode}
                onChange={(_, newValue) => setSelectedBarcode(newValue)}
                noOptionsText={
                  !selectedBook 
                    ? "Avval kitobni tanlang" 
                    : "Bu kitobning mavjud nusxalari yo'q"
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Kitob nusxasining shtrix-kodi"
                    placeholder={selectedBook ? "Shtrix-kodni tanlang..." : "Avval kitobni tanlang"}
                    variant="outlined"
                    required
                    helperText={
                      selectedBook && selectedBook.copies 
                        ? `${selectedBook.copies.filter((c) => c.status === 'AVAILABLE' || c.status === 'BORROWED').length} ta nusxa mavjud`
                        : null
                    }
                  />
                )}
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
                disabled={loading || !selectedUser || !selectedBarcode}
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
