// src/pages/librarian/FinesPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Tabs, Tab } from '@mui/material';
import api from '../../api';
import type { Fine } from '../../types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import toast from 'react-hot-toast';

const FinesPage: React.FC = () => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'unpaid' | 'paid' | 'all'>('unpaid');

  const fetchFines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { isPaid?: boolean } = {};
      if (filter === 'paid') params.isPaid = true;
      if (filter === 'unpaid') params.isPaid = false;
      
      const response = await api.get<Fine[]>('/fines', { params });
      setFines(response.data);
    } catch (err) {
      const errorMessage = 'Jarimalarni yuklashda xatolik yuz berdi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const handleMarkAsPaid = async (id: string) => {
    try {
      await api.post(`/fines/${id}/pay`);
      toast.success("Jarima muvaffaqiyatli to'landi!");
      fetchFines();
    } catch (error: any) {
      const message = error.response?.data?.message || "Jarimani to'langan deb belgilashda xatolik yuz berdi.";
      toast.error(message);
    }
  };

  if (loading) return <CircularProgress />;
  if (error && fines.length === 0) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Jarimalarni Boshqarish
      </Typography>
      <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={filter} onChange={(_, newValue) => setFilter(newValue)} variant="fullWidth">
            <Tab label="To'lanmagan" value="unpaid" />
            <Tab label="To'langan" value="paid" />
            <Tab label="Barchasi" value="all" />
          </Tabs>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Foydalanuvchi</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sababi</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Miqdori</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sana</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Statusi</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Harakatlar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fines.map((fine) => (
                <TableRow key={fine.id} hover>
                  <TableCell>{fine.user.firstName} {fine.user.lastName}</TableCell>
                  <TableCell>{fine.reason}</TableCell>
                  <TableCell>{fine.amount.toLocaleString()} so'm</TableCell>
                  <TableCell>{new Date(fine.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={fine.isPaid ? "To'langan" : "To'lanmagan"} color={fine.isPaid ? 'success' : 'error'} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    {!fine.isPaid && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleMarkAsPaid(fine.id)}
                      >
                        To'langan
                      </Button>
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

export default FinesPage;
