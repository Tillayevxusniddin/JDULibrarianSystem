// src/pages/librarian/SuggestionsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, ButtonGroup } from '@mui/material';
import { responsiveTableSx } from '../../components/common/tableResponsive';
import api from '../../api';
import type { Suggestion, SuggestionStatus } from '../../types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import toast from 'react-hot-toast';

const getStatusChip = (status: SuggestionStatus) => {
  const color = status === 'PENDING' ? 'warning' : status === 'APPROVED' ? 'success' : 'error';
  return <Chip label={status} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
};

const SuggestionsPage: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Suggestion[]>('/suggestions');
      setSuggestions(response.data);
    } catch (err) {
      const errorMessage = 'Takliflarni yuklashda xatolik yuz berdi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleStatusUpdate = async (id: string, status: SuggestionStatus) => {
    try {
      await api.put(`/suggestions/${id}`, { status });
      toast.success("Taklif statusi muvaffaqiyatli o'zgartirildi!");
      fetchSuggestions(); // Ma'lumotlarni yangilaymiz
    } catch (error) {
      toast.error("Statusni o'zgartirishda xatolik yuz berdi.");
    }
  };

  if (loading) return <CircularProgress />;
  if (error && suggestions.length === 0) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Kitob Takliflari
      </Typography>
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={responsiveTableSx}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', px: 5 }}>Sarlavha</TableCell>
                <TableCell sx={{ fontWeight: 'bold', px: 5 }}>Muallif</TableCell>
                <TableCell sx={{ fontWeight: 'bold', px: 5  }}>Foydalanuvchi</TableCell>
                <TableCell sx={{ fontWeight: 'bold', px: 2 }}>Statusi</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', px:6  }}>Harakatlar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suggestions.map((suggestion) => (
                <TableRow key={suggestion.id} hover>
                  <TableCell data-label="Sarlavha" sx={{ px: 5 }}>{suggestion.title}</TableCell>
                  <TableCell data-label="Muallif" sx={{ px: 5 }}>{suggestion.author || '—'}</TableCell>
                  <TableCell data-label="Foydalanuvchi" sx={{ px: 5 }}>{suggestion.user.firstName} {suggestion.user.lastName}</TableCell>
                  <TableCell data-label="Statusi" sx={{ px: 1 }}>{getStatusChip(suggestion.status)}</TableCell>
                  <TableCell data-label="Harakatlar" align="right">
                    {suggestion.status === 'PENDING' && (
                      <ButtonGroup variant="outlined" size="small">
                        <Button color="success" onClick={() => handleStatusUpdate(suggestion.id, 'APPROVED')}>
                          <CheckCircleIcon fontSize="small" />
                        </Button>
                        <Button color="error" onClick={() => handleStatusUpdate(suggestion.id, 'REJECTED')}>
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

export default SuggestionsPage;
