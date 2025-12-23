// src/pages/librarian/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../api';
import toast from 'react-hot-toast';

interface LibrarySettings {
  id: string;
  enableFines: boolean;
  fineAmountPerDay: string;
  createdAt: string;
  updatedAt: string;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<LibrarySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enableFines, setEnableFines] = useState(true);
  const [fineAmount, setFineAmount] = useState('5000');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get<LibrarySettings>('/settings');
      setSettings(response.data);
      setEnableFines(response.data.enableFines);
      setFineAmount(response.data.fineAmountPerDay);
    } catch (error) {
      toast.error('Sozlamalarni yuklashda xatolik yuz berdi.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    const fineAmountNum = parseFloat(fineAmount);
    
    if (isNaN(fineAmountNum) || fineAmountNum <= 0) {
      toast.error('Jarima miqdori 0 dan katta bo\'lishi kerak.');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/settings', {
        enableFines,
        fineAmountPerDay: fineAmountNum,
      });
      toast.success('Sozlamalar muvaffaqiyatli saqlandi.');
      fetchSettings();
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Sozlamalarni saqlashda xatolik yuz berdi.';
      toast.error(message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Kutubxona Sozlamalari
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Jarima Sozlamalari
        </Typography>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={enableFines}
                onChange={(e) => setEnableFines(e.target.checked)}
                color="primary"
              />
            }
            label="Muddati o'tgan kitoblar uchun avtomatik jarima solish"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 1 }}>
            Ushbu parametr o'chirilgan bo'lsa, tizim muddati o'tgan kitoblar uchun avtomatik
            jarima solmaydi.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Kunlik jarima miqdori (so'm)"
            type="number"
            value={fineAmount}
            onChange={(e) => setFineAmount(e.target.value)}
            disabled={!enableFines}
            helperText="Har bir kechiktirilgan kun uchun qo'llaniladigan jarima miqdori"
          />
        </Box>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </Button>
      </Paper>
    </Box>
  );
};

export default SettingsPage;
