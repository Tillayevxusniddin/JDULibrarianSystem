// src/pages/MyLoansPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button } from '@mui/material';
import api from '../api';
import type { Loan, LoanStatus } from '../types';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const getStatusChip = (status: LoanStatus) => {
  const color = status === 'ACTIVE' ? 'primary' : status === 'OVERDUE' ? 'error' : status === 'PENDING_RETURN' ? 'warning' : 'default';
  return <Chip label={status} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
};

const MyLoansPage: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Loan[]>('/loans/my');
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

  const handleRenewalRequest = async (loanId: string) => {
    try {
      await api.post(`/loans/${loanId}/renew`);
      toast.success('Muddatni uzaytirish so`rovi yuborildi!');
      fetchLoans();
    } catch (error: any) {
      const message = error.response?.data?.message || "So'rov yuborishda xatolik yuz berdi.";
      toast.error(message);
    }
  };

  if (loading) return <CircularProgress />;
  if (error && loans.length === 0) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Mening Ijaralarim
      </Typography>
      {loans.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <Typography color="text.secondary">Sizda hozircha ijaraga olingan kitoblar mavjud emas.</Typography>
        </Paper>
      ) : (
        <Paper component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Kitob Sarlavhasi</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Qaytarish Muddati</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Statusi</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Harakatlar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id} hover>
                    <TableCell>
                      <Link to={`/books/${loan.book.id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}>
                        {loan.book.title}
                      </Link>
                    </TableCell>
                    <TableCell>{new Date(loan.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusChip(loan.status)}</TableCell>
                    <TableCell align="right">
                      {loan.status === 'ACTIVE' && (
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => handleRenewalRequest(loan.id)}
                          disabled={loan.renewalRequested}
                        >
                          {loan.renewalRequested ? 'So`rov Yuborilgan' : 'Muddatni Uzaytirish'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default MyLoansPage;
