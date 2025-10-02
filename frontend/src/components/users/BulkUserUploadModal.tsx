import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, CircularProgress, Alert, Link } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import api from '../../api';
import toast from 'react-hot-toast';

interface BulkUserUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BulkUserUploadModal: React.FC<BulkUserUploadModalProps> = ({ open, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Iltimos, avval faylni tanlang.');
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append('usersFile', selectedFile);

    try {
      const response = await api.post('/users/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const { successfullyCreated, errors } = response.data.data;
      
      let message = '';
      if (successfullyCreated > 0) {
        message += `${successfullyCreated} ta foydalanuvchi muvaffaqiyatli yaratildi. `;
        toast.success(`${successfullyCreated} ta foydalanuvchi muvaffaqiyatli yaratildi.`);
      }
      if (errors && errors.length > 0) {
        message += `Ba'zi yozuvlarda xatolik yuz berdi.`;
        toast.error(`Faylda ${errors.length} ta xatolik topildi. Tafsilotlar uchun konsolni tekshiring.`);
        console.error("Ommaviy yuklashdagi xatoliklar:", errors);
      }
      
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Faylni yuklashda xatolik yuz berdi.');
    } finally {
      setSubmitting(false);
      setSelectedFile(null); // Faylni tozalash
    }
  };

  // Modal yopilganda tanlangan faylni tozalash
  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 'bold' }}>Excel Orqali Ommaviy Qo'shish</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Excel faylida quyidagi ustunlar bo'lishi shart: <strong>firstName</strong>, <strong>lastName</strong>, <strong>email</strong>.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
            DIQQAT: Parol ustuni kerak EMAS. Tizim har bir foydalanuvchi uchun avtomatik parol yaratib, emailiga jo'natadi.
          </Typography>
        </Alert>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {/* Bu yerga shablon faylingizga to'g'ri yo'lni qo'yasiz, masalan /templates/users_template.xlsx */}
          <Link href={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/public/templates/users_template.xlsx`} download>
              Excel shablonini yuklab olish
          </Link>
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          component="label"
          startIcon={<FileUploadIcon />}
          sx={{ mt: 2, textTransform: 'none', p: 2, borderStyle: 'dashed' }}
        >
          {selectedFile ? `Tanlandi: ${selectedFile.name}` : "Excel Faylni Tanlang (.xlsx, .xls)"}
          <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
        </Button>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>Bekor qilish</Button>
        <Button onClick={handleUpload} variant="contained" disabled={!selectedFile || submitting}>
          {submitting ? <CircularProgress size={24} /> : "Yuklash"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkUserUploadModal;