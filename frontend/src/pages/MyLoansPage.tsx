// src/pages/MyLoansPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Tabs, Tab } from '@mui/material';
import { responsiveTableSx } from '../components/common/tableResponsive';
import api from '../api';
import type { Loan, LoanStatus } from '../types';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const getStatusChip = (status: LoanStatus) => {
  const color = status === 'ACTIVE' ? 'primary' : status === 'OVERDUE' ? 'error' : status === 'PENDING_RETURN' ? 'warning' : 'success';
  return <Chip label={status.replace('_', ' ')} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
};

const MyLoansPage: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Loan[]>('/loans/my', { params: { status: tab } });
      setLoans(response.data);
    } catch (err) {
      const errorMessage = 'Ijaralarni yuklashda xatolik yuz berdi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Renewal request functionality disabled - librarian controls extensions
  // const handleRenewalRequest = async (loanId: string) => {
  //   try {
  //     await api.post(`/loans/${loanId}/renew`);
  //     toast.success('Muddatni uzaytirish so`rovi yuborildi!');
  //     fetchLoans();
  //   } catch (error: any) {
  //     const message = error.response?.data?.message || "So'rov yuborishda xatolik yuz berdi.";
  //     toast.error(message);
  //   }
  // };

  // Return functionality disabled - librarian controls all loan actions
  // const handleInitiateReturn = async (loanId: string) => {
  //   try {
  //     await api.post(`/loans/${loanId}/return`);
  //     toast.success('Kitobni qaytarish so`rovi yuborildi! Kutubxonachi tasdiqlaganda kitob qaytariladi.');
  //     fetchLoans();
  //   } catch (error: any) {
  //     const message = error.response?.data?.message || "So'rov yuborishda xatolik yuz berdi.";
  //     toast.error(message);
  //   }
  // };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Mening Ijaralarim
      </Typography>
      
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} variant="fullWidth">
            <Tab label="Aktiv Ijaralar" value="active" />
            <Tab label="Ijara Tarixi" value="history" />
          </Tabs>
        </Box>
        
        {loans.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {tab === 'active' ? "Sizda aktiv ijaralar mavjud emas." : "Sizning ijara tarixingiz bo'sh."}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={responsiveTableSx}>
              <TableHead>
                <TableRow>
                  {/* --- UI O'ZGARISHI: Ustunlarga kenglik berildi --- */}
                  <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Kitob Sarlavhasi</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Qaytarish Muddati</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Statusi</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', width: '20%' }}>Harakatlar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id} hover>
                    <TableCell data-label="Kitob Sarlavhasi">
                      <Link to={`/books/${loan.bookCopy.book.id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}>
                        {loan.bookCopy.book.title}
                      </Link>
                    </TableCell>
                    <TableCell data-label="Qaytarish Muddati">{new Date(loan.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell data-label="Statusi">{getStatusChip(loan.status)}</TableCell>
                    <TableCell data-label="Harakatlar" align="right">
                      {/* All student actions disabled - librarian controls extensions and returns */}
                      {/* {loan.status === 'ACTIVE' && (
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button 
                            size="small" 
                            variant="contained"
                            color="success"
                            onClick={() => handleInitiateReturn(loan.id)}
                          >
                            Qaytarish
                          </Button>
                        </Box>
                      )} */}
                      {loan.status === 'PENDING_RETURN' && (
                        <Chip label="Qaytarish Kutilmoqda" color="warning" size="small" />
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

export default MyLoansPage;
