// src/pages/librarian/FinesPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Tabs, Tab, TextField } from '@mui/material';
import { responsiveTableSx } from '../../components/common/tableResponsive';
import api from '../../api';
import type { Fine } from '../../types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import toast from 'react-hot-toast';

const FinesPage: React.FC = () => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'unpaid' | 'paid' | 'all'>('unpaid');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

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

  const evaluateExpression = (expression: string): number | null => {
    try {
      // Remove spaces and validate the expression contains only numbers, +, -, *, /, (, )
      const cleanExpression = expression.replace(/\s/g, '');
      
      // Strict validation: only allow digits and basic math operators
      if (!/^[\d+\-*/().]+$/.test(cleanExpression)) {
        return null;
      }
      
      // Additional safety: prevent empty expressions or expressions with only operators
      if (!cleanExpression || /^[+\-*/().]+$/.test(cleanExpression)) {
        return null;
      }
      
      // Evaluate the expression safely within a restricted context
      const result = Function(`'use strict'; return (${cleanExpression})`)();
      return typeof result === 'number' && !isNaN(result) && isFinite(result) 
        ? Math.max(0, Math.round(result)) 
        : null;
    } catch {
      return null;
    }
  };

  const handleAmountClick = (fine: Fine) => {
    setEditingId(fine.id);
    setEditValue(fine.amount.toString());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleAmountKeyDown = async (e: React.KeyboardEvent, fineId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleAmountUpdate(fineId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditValue('');
    }
  };

  const handleAmountUpdate = async (fineId: string) => {
    if (!editValue.trim()) {
      setEditingId(null);
      setEditValue('');
      return;
    }

    const newAmount = evaluateExpression(editValue);
    
    if (newAmount === null) {
      toast.error("Noto'g'ri ifoda. Faqat raqamlar va matematik amallar (+, -, *, /) ishlatilishi mumkin.");
      return;
    }

    try {
      await api.patch(`/fines/${fineId}/amount`, { amount: newAmount });
      toast.success('Jarima miqdori muvaffaqiyatli yangilandi!');
      setEditingId(null);
      setEditValue('');
      fetchFines();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Jarima miqdorini yangilashda xatolik yuz berdi.';
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
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={filter} onChange={(_, newValue) => setFilter(newValue)} variant="fullWidth">
            <Tab label="To'lanmagan" value="unpaid" />
            <Tab label="To'langan" value="paid" />
            <Tab label="Barchasi" value="all" />
          </Tabs>
        </Box>
        <TableContainer>
          <Table sx={responsiveTableSx}>
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
                  <TableCell data-label="Foydalanuvchi">{fine.user.firstName} {fine.user.lastName}</TableCell>
                  <TableCell data-label="Sababi">{fine.reason}</TableCell>
                  <TableCell 
                    data-label="Miqdori" 
                    onClick={() => !fine.isPaid && handleAmountClick(fine)}
                    sx={{ 
                      cursor: fine.isPaid ? 'default' : 'pointer',
                      '&:hover': fine.isPaid ? {} : { backgroundColor: 'action.hover' }
                    }}
                  >
                    {editingId === fine.id ? (
                      <TextField
                        value={editValue}
                        onChange={handleAmountChange}
                        onKeyDown={(e) => handleAmountKeyDown(e, fine.id)}
                        onBlur={() => {
                          setEditingId(null);
                          setEditValue('');
                        }}
                        size="small"
                        autoFocus
                        placeholder="Masalan: 12000-4000"
                        sx={{ width: '180px' }}
                      />
                    ) : (
                      `${fine.amount.toLocaleString()} so'm`
                    )}
                  </TableCell>
                  <TableCell data-label="Sana">{new Date(fine.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell data-label="Statusi">
                    <Chip label={fine.isPaid ? "To'langan" : "To'lanmagan"} color={fine.isPaid ? 'success' : 'error'} size="small" />
                  </TableCell>
                  <TableCell data-label="Harakatlar" align="right">
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
