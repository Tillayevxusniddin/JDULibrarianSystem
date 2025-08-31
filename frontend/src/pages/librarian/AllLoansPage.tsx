// src/pages/librarian/AllLoansPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, ButtonGroup, Tabs, Tab } from '@mui/material';
import api from '../../api';
import type { Loan, LoanStatus } from '../../types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import toast from 'react-hot-toast';

const getStatusChip = (status: LoanStatus) => {
  const color = status === 'ACTIVE' ? 'primary' : status === 'OVERDUE' ? 'error' : status === 'PENDING_RETURN' ? 'warning' : 'success';
  return <Chip label={status.replace('_', ' ')} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
};

const AllLoansPage: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'renewal' | 'active' | 'history'>('pending');

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Loan[]>('/loans', { params: { filter } });
      setLoans(response.data);
    } catch (err) {
      const errorMessage = 'Ijaralarni yuklashda xatolik yuz berdi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filter]);

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

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Ijaralarni Boshqarish
      </Typography>
      <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={filter} onChange={(_, newValue) => setFilter(newValue)} variant="fullWidth" sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                flex: 1,
                maxWidth: 'none'
              },
              '& .MuiTabs-flexContainer': {
                justifyContent: 'space-between'
              }
            }}
>
            <Tab label="Qaytarish Kutilyapti" value="pending" />
            <Tab label="Muddat Uzaytirish" value="renewal" />
            <Tab label="Barcha Aktiv Ijaralar" value="active" />
            <Tab label="Ijara Tarixi" value="history" />
          </Tabs>
        </Box>
        {loans.length === 0 ? (
           <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Bu bo'limda hozircha yozuvlar mavjud emas.
            </Typography>
          </Box>
        ) : (
        <TableContainer>
          <Table sx={{ minWidth: 650, tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                {/* --- YAXSHILANGAN: Chiziqlar olib tashlandi, teng masofada taqsimlandi --- */}
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  width: '25%', 
                  px: 4, 
                  py: 2
                }}>
                  Kitob
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  width: '25%', 
                  px: 4, 
                  py: 2
                }}>
                  Foydalanuvchi
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  width: '25%', 
                  px: 4, 
                  py: 2
                }}>
                  Qaytarish Muddati
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  width: '25%', 
                  px: 4, 
                  py: 2
                }}>
                  Statusi
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontWeight: 'bold', 
                  width: '25%', 
                  px: 4, 
                  py: 2
                }}>
                  Harakatlar
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loans.map((loan) => (
                <TableRow key={loan.id} hover sx={{ 
                  '&:hover': { backgroundColor: '#f8f9fa' }
                }}>
                  <TableCell sx={{ 
                    px: 4, 
                    py: 3,
                    fontWeight: 500
                  }}>
                    {loan.bookCopy.book.title}
                  </TableCell>
                  <TableCell sx={{ 
                    px: 4, 
                    py: 3
                  }}>
                    {loan.user.firstName} {loan.user.lastName}
                  </TableCell>
                  <TableCell sx={{ 
                    px: 4, 
                    py: 3
                  }}>
                    {new Date(loan.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ 
                    px: 4, 
                    py: 3
                  }}>
                    {getStatusChip(loan.status)}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    px: 4, 
                    py: 3
                  }}>
                    {loan.status === 'PENDING_RETURN' && (
                      <Button 
                        variant="contained" 
                        size="small" 
                        sx={{ minWidth: 'auto', px: 2 }}
                        onClick={() => handleAction(() => api.post(`/loans/${loan.id}/confirm-return`), 'Qaytarish tasdiqlandi!')}
                      >
                        Tasdiqlash
                      </Button>
                    )}
                    {loan.renewalRequested && loan.status === 'ACTIVE' && (
                      <ButtonGroup variant="outlined" size="small" sx={{ '& .MuiButton-root': { minWidth: 'auto', px: 1.5 } }}>
                        <Button 
                          color="success" 
                          onClick={() => handleAction(() => api.post(`/loans/${loan.id}/approve-renewal`), 'So`rov tasdiqlandi!')}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </Button>
                        <Button 
                          color="error" 
                          onClick={() => handleAction(() => api.post(`/loans/${loan.id}/reject-renewal`), 'So`rov rad etildi!')}
                        >
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
        )}
      </Paper>
    </Box>
  );
};

export default AllLoansPage;