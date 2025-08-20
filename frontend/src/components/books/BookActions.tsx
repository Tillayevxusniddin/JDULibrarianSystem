// src/components/books/BookActions.tsx
import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, TextField } from '@mui/material';
import api from '../../api';
import type { Book, Loan } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast'; 
// --- 1. Bildirishnomalar store'ini import qilamiz ---
import { useNotificationStore } from '../../store/notification.store';

interface SearchedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface BookActionsProps {
  book: Book;
  onActionSuccess: () => void;
}

const BookActions: React.FC<BookActionsProps> = ({ book, onActionSuccess }) => {
  const { user } = useAuthStore();
  const [userLoan, setUserLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckingLoan, setIsCheckingLoan] = useState(true);
  
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<SearchedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // --- 2. Store'dan kerakli funksiyani olamiz ---
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  useEffect(() => {
    if (user && book) {
      setIsCheckingLoan(true);
      api.get<Loan[]>('/loans/my').then(response => {
        const loanForThisBook = response.data.find(loan => loan.bookId === book.id && (loan.status === 'ACTIVE' || loan.status === 'OVERDUE'));
        setUserLoan(loanForThisBook || null);
      }).finally(() => setIsCheckingLoan(false));
    } else {
      setIsCheckingLoan(false);
    }
  }, [book, user, onActionSuccess]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setOptions([]);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(() => {
      api.get<SearchedUser[]>(`/users/search?q=${searchQuery}`)
        .then(response => setOptions(response.data))
        .finally(() => setSearchLoading(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAction = async (action: () => Promise<any>, successMessage: string, errorMessage: string, shouldFetchNotifications = false) => {
    setLoading(true);
    try {
      await action();
      toast.success(successMessage);
      onActionSuccess();
      // --- 3. Agar kerak bo'lsa, bildirishnomalarni yangilaymiz ---
      if (shouldFetchNotifications) {
        fetchNotifications();
      }
    } catch (error: any ){
      const message = error.response?.data?.message || errorMessage;
      toast.error(message); 
    } finally {
      setLoading(false);
    }
  };

  // --- 4. handleReserve'ga `true` parametrini qo'shamiz ---
  const handleReserve = () => handleAction(() => api.post(`/books/${book.id}/reserve`), 'Kitob muvaffaqiyatli band qilindi!', 'Kitobni band qilishda xatolik yuz berdi.', true);
  const handleReturn = () => userLoan && handleAction(() => api.post(`/loans/${userLoan.id}/return`), 'Kitobni qaytarish so`rovi yuborildi.', 'Kitobni qaytarishda xatolik yuz berdi.');

  const handleCreateLoan = () => {
    if (!selectedUser) return toast.error('Iltimos, foydalanuvchini tanlang.');
    handleAction(
      () => api.post('/loans', { bookId: book.id, userId: selectedUser.id }),
      'Kitob muvaffaqiyatli ijaraga berildi.',
      'Kitobni ijaraga berishda xatolik yuz berdi.'
    ).then(() => {
      setOpen(false);
      setSelectedUser(null);
      setSearchQuery('');
    });
  };

  if (!user || isCheckingLoan) return <Box className="pt-6 mt-6 border-t"><CircularProgress size={24} /></Box>;

  return (
    <Box className="flex items-center pt-6 mt-6 space-x-2 border-t">
      {loading && <CircularProgress size={24} />}
      
      {user.role === 'LIBRARIAN' && book.status === 'AVAILABLE' && (
        <Button variant="contained" onClick={() => setOpen(true)} disabled={loading}>
          Ijaraga Berish
        </Button>
      )}

      {user.role === 'USER' && (book.status === 'BORROWED' || book.status === 'AVAILABLE') && !userLoan && (
        <Button variant="contained" color="secondary" onClick={handleReserve} disabled={loading}>
          Band Qilish
        </Button>
      )}

      {user.role === 'USER' && userLoan && (
        <Button variant="contained" color="warning" onClick={handleReturn} disabled={loading}>
          Kitobni Qaytarish
        </Button>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Foydalanuvchini Tanlab Ijaraga Berish</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={options}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
            loading={searchLoading}
            value={selectedUser}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Foydalanuvchini ismi yoki emaili bo'yicha qidiring"
                variant="standard"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleCreateLoan} disabled={loading || !selectedUser}>Tasdiqlash</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookActions;
