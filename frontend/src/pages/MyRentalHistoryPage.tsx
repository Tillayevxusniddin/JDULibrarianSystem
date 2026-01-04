import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Tabs, Tab } from '@mui/material';
import { responsiveTableSx } from '../components/common/tableResponsive';
import api from '../api';
import type { Loan, LoanStatus } from '../types';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const getStatusChip = (status: LoanStatus) => {
  const statusConfig = {
    ACTIVE: { label: 'AKTIV', color: 'primary' as const },
    OVERDUE: { label: "MUDDATI O'TGAN", color: 'error' as const },
    PENDING_RETURN: { label: 'QAYTARILMOQDA', color: 'warning' as const },
    RETURNED: { label: 'QAYTARILDI', color: 'success' as const },
  };
  
  const config = statusConfig[status] || { label: status, color: 'default' as const };
  return <Chip label={config.label} color={config.color} size="small" sx={{ fontWeight: 'bold' }} />;
};

const MyRentalHistoryPage: React.FC = () => {
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
      const errorMessage = 'Ijara tarixini yuklashda xatolik yuz berdi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Ijara Tarixi
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
              {tab === 'active' 
                ? "Sizda aktiv ijaralar mavjud emas." 
                : "Sizning ijara tarixingiz bo'sh."}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={responsiveTableSx}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '35%' }}>Kitob Nomi</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Ijaraga Olindi</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>
                    {tab === 'active' ? 'Qaytarish Muddati' : 'Qaytarildi'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Statusi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id} hover>
                    <TableCell data-label="Kitob Nomi">
                      <Link 
                        to={`/books/${loan.bookCopy.book.id}`} 
                        style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}
                      >
                        {loan.bookCopy.book.title}
                      </Link>
                    </TableCell>
                    <TableCell data-label="Ijaraga Olindi">
                      {new Date(loan.borrowedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell data-label={tab === 'active' ? 'Qaytarish Muddati' : 'Qaytarildi'}>
                      {tab === 'active' 
                        ? new Date(loan.dueDate).toLocaleDateString()
                        : loan.returnedAt 
                          ? new Date(loan.returnedAt).toLocaleDateString()
                          : '-'
                      }
                    </TableCell>
                    <TableCell data-label="Statusi">
                      {getStatusChip(loan.status)}
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

export default MyRentalHistoryPage;
