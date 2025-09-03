// src/pages/MyReservationsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { responsiveTableSx } from '../components/common/tableResponsive';
import api from '../api';
import type { Reservation, ReservationStatus } from '../types';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const getStatusChip = (status: ReservationStatus) => {
  const color = status === 'ACTIVE' ? 'info' : status === 'AWAITING_PICKUP' ? 'success' : 'default';
  return <Chip label={status.replace('_', ' ')} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
};

const MyReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Reservation[]>('/reservations/my');
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

  const openConfirmDialog = (id: string) => {
    setReservationToCancel(id);
    setConfirmOpen(true);
  };

  const handleCancel = async () => {
    if (!reservationToCancel) return;
    try {
      await api.delete(`/reservations/${reservationToCancel}`);
      toast.success('Rezervatsiya muvaffaqiyatli bekor qilindi.');
      fetchReservations();
    } catch (error) {
      toast.error('Bekor qilishda xatolik yuz berdi.');
    } finally {
        setConfirmOpen(false);
        setReservationToCancel(null);
    }
  };

  if (loading) return <CircularProgress />;
  if (error && reservations.length === 0) return <Alert severity="error">{error}</Alert>;

  return (
    <>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
          Mening Rezervlarim
        </Typography>
        {reservations.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
            <Typography color="text.secondary">Sizda band qilingan kitoblar mavjud emas.</Typography>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
            <TableContainer>
              <Table sx={responsiveTableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Kitob Sarlavhasi</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Statusi</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Muddati Tugaydi</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Harakatlar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reservations.map((res) => (
                    <TableRow key={res.id} hover>
                      <TableCell data-label="Kitob Sarlavhasi">
                        <Link to={`/books/${res.book.id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}>
                          {res.book.title}
                        </Link>
                      </TableCell>
                      <TableCell data-label="Statusi">{getStatusChip(res.status)}</TableCell>
                      <TableCell data-label="Muddati Tugaydi">
                        {res.status === 'AWAITING_PICKUP' && res.expiresAt
                          ? new Date(res.expiresAt).toLocaleString()
                          : 'Kitob qaytarilishini kuting'}
                      </TableCell>
                      <TableCell data-label="Harakatlar" align="right">
                        {(res.status === 'ACTIVE' || res.status === 'AWAITING_PICKUP') && (
                          <Button size="small" color="error" onClick={() => openConfirmDialog(res.id)}>
                            Bekor qilish
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

      <Dialog open={isConfirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Bekor qilishni tasdiqlang</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Haqiqatan ham bu rezervatsiyani bekor qilmoqchimisiz?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Yo'q</Button>
          <Button onClick={handleCancel} color="error">
            Ha, bekor qilish
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MyReservationsPage;
