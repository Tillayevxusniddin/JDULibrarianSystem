// src/pages/librarian/ReservationsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Alert } from '@mui/material';
import api from '../../api';
import type { Reservation, ReservationStatus } from '../../types';
import toast from 'react-hot-toast';

const getStatusChip = (status: ReservationStatus) => {
  const color = status === 'ACTIVE' ? 'info' : status === 'AWAITING_PICKUP' ? 'success' : status === 'EXPIRED' ? 'error' : 'default';
  return <Chip label={status.replace('_', ' ')} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
};

const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Reservation[]>('/reservations');
      setReservations(response.data);
    } catch (err) {
      const errorMessage = 'Rezervatsiyalarni yuklashda xatolik yuz berdi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleFulfill = async (reservationId: string) => {
    try {
      await api.post(`/reservations/${reservationId}/fulfill`);
      toast.success('Kitob muvaffaqiyatli ijaraga berildi!');
      fetchReservations();
    } catch (error: any) {
      const message = error.response?.data?.message || "Amalni bajarishda xatolik yuz berdi.";
      toast.error(message);
    }
  };

  if (loading) return <CircularProgress />;
  if (error && reservations.length === 0) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Rezervatsiyalarni Boshqarish
      </Typography>
      <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', px: 5 }}>Kitob</TableCell>
                <TableCell sx={{ fontWeight: 'bold', px: 5 }}>Foydalanuvchi</TableCell>
                <TableCell sx={{ fontWeight: 'bold', px: 5 }}>Statusi</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', px: 7 }}>Harakatlar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations.map((res) => (
                <TableRow key={res.id} hover>
                  <TableCell sx={{ px: 3 }}>{res.book.title}</TableCell>
                  <TableCell sx={{ px: 3 }}>{res.user.firstName} {res.user.lastName}</TableCell>
                  <TableCell sx={{ px: 3 }}>{getStatusChip(res.status)}</TableCell>
                  <TableCell align="right" sx={{ px: 3 }}>
                    {res.status === 'AWAITING_PICKUP' && (
                      <Button size="small" variant="contained" onClick={() => handleFulfill(res.id)}>
                        Ijaraga Berish
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

export default ReservationsPage;
