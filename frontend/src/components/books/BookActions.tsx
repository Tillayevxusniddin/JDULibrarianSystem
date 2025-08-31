import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, TextField, Typography } from '@mui/material';
import api from '../../api';
import type { Book, Loan } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';
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
  
  // --- IJARAGA BERISH OYNASI UCHUN STATE'LAR ---
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userOptions, setUserOptions] = useState<SearchedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [barcode, setBarcode] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  useEffect(() => {
    // Foydalanuvchining shu nomdagi kitobdan ijarasi bor-yo'qligini tekshirish
    if (user && book) {
      setIsCheckingLoan(true);
      api.get<Loan[]>('/loans/my').then(response => {
        // --- O'ZGARTIRILGAN MANTIQ: Endi loan.bookCopy.book.id orqali tekshiramiz ---
        const loanForThisBook = response.data.find(loan => 
          loan.bookCopy.book.id === book.id && ['ACTIVE', 'OVERDUE'].includes(loan.status)
        );
        setUserLoan(loanForThisBook || null);
      }).finally(() => setIsCheckingLoan(false));
    } else {
      setIsCheckingLoan(false);
    }
  }, [book, user, onActionSuccess]);

  // Foydalanuvchilarni qidirish (o'zgarishsiz)
  useEffect(() => {
    if (searchQuery.length < 2) {
      setUserOptions([]);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(() => {
      api.get<SearchedUser[]>(`/users/search?q=${searchQuery}`)
        .then(response => setUserOptions(response.data))
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
      if (shouldFetchNotifications) {
        fetchNotifications();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || errorMessage;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = () => handleAction(() => api.post(`/books/${book.id}/reserve`), 'Kitob muvaffaqiyatli band qilindi!', 'Kitobni band qilishda xatolik yuz berdi.', true);
  const handleReturn = () => userLoan && handleAction(() => api.post(`/loans/${userLoan.id}/return`), 'Kitobni qaytarish so\'rovi yuborildi.', 'Kitobni qaytarishda xatolik yuz berdi.');

  // --- O'ZGARTIRILGAN MANTIQ: Ijaraga berish endi barcode bilan ishlaydi ---
  const handleCreateLoan = () => {
    if (!selectedUser) return toast.error('Iltimos, foydalanuvchini tanlang.');
    if (!barcode.trim()) return toast.error('Iltimos, kitob nusxasining shtrix-kodini kiriting.');
    
    handleAction(
      () => api.post('/loans', { barcode: barcode.trim(), userId: selectedUser.id }),
      'Kitob muvaffaqiyatli ijaraga berildi.',
      'Kitobni ijaraga berishda xatolik yuz berdi.'
    ).then(() => {
      setLoanModalOpen(false);
      setSelectedUser(null);
      setSearchQuery('');
      setBarcode('');
    });
  };

  if (!user || isCheckingLoan) return <Box className="pt-6 mt-6 border-t"><CircularProgress size={24} /></Box>;
  
  const canReserveOrBorrow = book.availableCopies > 0;

  return (
    <Box className="flex items-center pt-6 mt-6 space-x-2 border-t">
      {loading && <CircularProgress size={24} />}
      
      {user.role === 'LIBRARIAN' && canReserveOrBorrow && (
        <Button variant="contained" onClick={() => setLoanModalOpen(true)} disabled={loading}>
          Ijaraga Berish
        </Button>
      )}

      {user.role === 'USER' && !userLoan && (
        <Button variant="contained" color="secondary" onClick={handleReserve} disabled={loading}>
          Band Qilish
        </Button>
      )}

      {user.role === 'USER' && userLoan && (
        <Button variant="contained" color="warning" onClick={handleReturn} disabled={loading}>
          Kitobni Qaytarish
        </Button>
      )}

      {/* --- YANGI IJARAGA BERISH OYNASI --- */}
      <Dialog open={loanModalOpen} onClose={() => setLoanModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Ijaraga Berish</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '20px !important' }}>
          <Typography variant="body1">
            Kitob nomi: <strong>{book.title}</strong>
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Kitob nusxasining shtrix-kodi"
            variant="outlined"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            required
          />
          <Autocomplete
            options={userOptions}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
            loading={searchLoading}
            value={selectedUser}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Foydalanuvchini qidiring"
                variant="outlined"
                required
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
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={() => setLoanModalOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleCreateLoan} variant="contained" disabled={loading || !selectedUser || !barcode}>Tasdiqlash</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookActions;