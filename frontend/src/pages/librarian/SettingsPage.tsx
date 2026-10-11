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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../api';
import toast from 'react-hot-toast';

type FineIntervalUnit = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

interface LibrarySettings {
  id: string;
  enableFines: boolean;
  fineAmountPerDay: string;
  fineIntervalUnit: FineIntervalUnit;
  fineIntervalDays: number | null;
  createdAt: string;
  updatedAt: string;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<LibrarySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enableFines, setEnableFines] = useState(true);
  const [fineAmount, setFineAmount] = useState('5000');
  const [intervalUnit, setIntervalUnit] = useState<FineIntervalUnit>('DAILY');
  const [intervalDays, setIntervalDays] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get<LibrarySettings>('/settings');
      setSettings(response.data);
      setEnableFines(response.data.enableFines);
      setFineAmount(response.data.fineAmountPerDay);
      setIntervalUnit(response.data.fineIntervalUnit);
      setIntervalDays(response.data.fineIntervalDays?.toString() || '');
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

    // Validate custom interval days
    if (intervalUnit === 'CUSTOM') {
      const intervalDaysNum = parseInt(intervalDays);
      if (isNaN(intervalDaysNum) || intervalDaysNum <= 0) {
        toast.error('CUSTOM interval uchun kunlar soni 0 dan katta bo\'lishi kerak.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        enableFines,
        fineAmountPerDay: fineAmountNum,
        fineIntervalUnit: intervalUnit,
      };

      if (intervalUnit === 'CUSTOM') {
        payload.fineIntervalDays = parseInt(intervalDays);
      } else {
        payload.fineIntervalDays = null;
      }

      await api.patch('/settings', payload);
      toast.success('Sozlamalar muvaffaqiyatli saqlandi.');
      fetchSettings();
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Sozlamalarni saqlashda xatolik yuz berdi.';
      toast.error(message);
    }
    setSaving(false);
  };

  const getIntervalDescription = () => {
    switch (intervalUnit) {
      case 'DAILY':
        return 'Har kuni jarima yoziladi';
      case 'WEEKLY':
        return 'Har hafta (7 kun) jarima yoziladi';
      case 'MONTHLY':
        return 'Har oy (30 kun) jarima yoziladi';
      case 'CUSTOM':
        return 'Belgilangan kunlar soni bo\'yicha jarima yoziladi';
      default:
        return '';
    }
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
            helperText="Har bir kun uchun qo'llaniladigan jarima miqdori"
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth disabled={!enableFines}>
            <InputLabel>Jarima Intervali</InputLabel>
            <Select
              value={intervalUnit}
              label="Jarima Intervali"
              onChange={(e) => setIntervalUnit(e.target.value as FineIntervalUnit)}
            >
              <MenuItem value="DAILY">Kunlik</MenuItem>
              <MenuItem value="WEEKLY">Haftalik</MenuItem>
              <MenuItem value="MONTHLY">Oylik</MenuItem>
              <MenuItem value="CUSTOM">Maxsus</MenuItem>
            </Select>
            <FormHelperText>{getIntervalDescription()}</FormHelperText>
          </FormControl>
        </Box>

        {intervalUnit === 'CUSTOM' && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Interval kunlari soni"
              type="number"
              value={intervalDays}
              onChange={(e) => setIntervalDays(e.target.value)}
              disabled={!enableFines}
              helperText="Qancha kundan keyin jarima yozilishi (masalan: 3, 5, 10)"
              required
            />
          </Box>
        )}

        <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="info.contrastText">
            <strong>Misol:</strong> Agar kunlik jarima 5000 so'm va interval "Haftalik" bo'lsa,
            har 7 kunda bir marta 35,000 so'm (5000 × 7) jarima yoziladi.
          </Typography>
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
