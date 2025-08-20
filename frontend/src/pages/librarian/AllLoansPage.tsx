// src/pages/librarian/AllLoansPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, ButtonGroup, Tabs, Tab } from '@mui/material';
import api from '../../api';
import type { Loan, LoanStatus } from '../../types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import toast from 'react-hot-toast';

const getStatusChip = (status: LoanStatus) => {
  const color = status === 'ACTIVE' ? 'primary' : status === 'OVERDUE' ? 'error' : status === 'PENDING_RETURN' ? 'warning' : 'default';
  return <Chip label={status} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
};

const AllLoansPage: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'renewal' | 'all'>('pending');

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Loan[]>('/loans');
      setLoans(response.data);
    } catch (err) {
      const errorMessage = 'Ijaralarni yuklashda xatolik yuz berdi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleAction = async (action: () => Promise<any>, successMessage: string) => {
    try {
      await action();
      toast.success(successMessage);
      fetchLoans();
    } catch (error: any) {
      const message = error.response?.data?.message || "Amalni bajarishda xatolik yuz berdi.";
      toast.error(message);
    }
  };

  const filteredLoans = loans.filter(loan => {
    if (filter === 'pending') return loan.status === 'PENDING_RETURN';
    if (filter === 'renewal') return loan.renewalRequested === true && loan.status === 'ACTIVE';
    return true;
  });

  if (loading) return <CircularProgress />;
  if (error && loans.length === 0) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Ijaralarni Boshqarish
      </Typography>
      <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={filter} onChange={(_, newValue) => setFilter(newValue)} variant="fullWidth">
            <Tab label="Qaytarish Kutilayotganlar" value="pending" />
            <Tab label="Muddat Uzaytirish So'rovlari" value="renewal" />
            <Tab label="Barcha Ijaralar" value="all" />
          </Tabs>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Kitob</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Foydalanuvchi</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Qaytarish Muddati</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Statusi</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Harakatlar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLoans.map((loan) => (
                <TableRow key={loan.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{loan.book.title}</TableCell>
                  <TableCell>{loan.user.firstName} {loan.user.lastName}</TableCell>
                  <TableCell>{new Date(loan.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusChip(loan.status)}</TableCell>
                  <TableCell align="right">
                    {loan.status === 'PENDING_RETURN' && (
                      <Button variant="contained" size="small" onClick={() => handleAction(() => api.post(`/loans/${loan.id}/confirm-return`), 'Qaytarish tasdiqlandi!')}>
                        Tasdiqlash
                      </Button>
                    )}
                    {loan.renewalRequested && loan.status === 'ACTIVE' && (
                      <ButtonGroup variant="outlined" size="small">
                        <Button color="success" onClick={() => handleAction(() => api.post(`/loans/${loan.id}/approve-renewal`), 'So`rov tasdiqlandi!')}>
                          <CheckCircleIcon fontSize="small" />
                        </Button>
                        <Button color="error" onClick={() => handleAction(() => api.post(`/loans/${loan.id}/reject-renewal`), 'So`rov rad etildi!')}>
                          <CancelIcon fontSize="small" />
                        </Button>
                      </ButtonGroup>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AllLoansPage;
