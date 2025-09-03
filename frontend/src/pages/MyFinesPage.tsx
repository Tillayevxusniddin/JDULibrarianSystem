// src/pages/MyFinesPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { responsiveTableSx } from '../components/common/tableResponsive';
import api from '../api';
import type { Fine } from '../types';
import { Link } from 'react-router-dom';

const MyFinesPage: React.FC = () => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Fine[]>('/fines/my');
      setFines(response.data);
    } catch (err) {
      setError('Jarimalarni yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Mening Jarimalarim
      </Typography>
      {fines.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <Typography color="text.secondary">Sizda hozircha jarimalar mavjud emas.</Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <TableContainer>
            <Table sx={responsiveTableSx}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Kitob</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Sababi</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Miqdori</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Sana</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Statusi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fines.map((fine) => (
                  <TableRow key={fine.id} hover>
                    <TableCell data-label="Kitob">
                      {/* --- O'ZGARISH: Murojaat yo'li yangilandi + optional chaining --- */}
                      {fine.loan ? (
                        <Link to={`/books/${fine.loan.bookCopy.book.id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}>
                          {fine.loan.bookCopy.book.title}
                        </Link>
                      ) : (
                        'Ijaraga bog\'lanmagan'
                      )}
                    </TableCell>
                    <TableCell data-label="Sababi">{fine.reason}</TableCell>
                    <TableCell data-label="Miqdori">{fine.amount.toLocaleString()} so'm</TableCell>
                    <TableCell data-label="Sana">{new Date(fine.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell data-label="Statusi">
                      <Chip label={fine.isPaid ? "To'langan" : "To'lanmagan"} color={fine.isPaid ? 'success' : 'error'} size="small" />
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

export default MyFinesPage;
