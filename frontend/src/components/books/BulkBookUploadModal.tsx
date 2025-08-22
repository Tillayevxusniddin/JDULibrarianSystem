import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, CircularProgress, Link } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import api from '../../api';
import toast from 'react-hot-toast';

interface BulkBookUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BulkBookUploadModal: React.FC<BulkBookUploadModalProps> = ({ open, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Iltimos, avval faylni tanlang.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('booksFile', selectedFile);

    try {
      const response = await api.post('/books/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(response.data.message);
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.message || "Faylni yuklashda xatolik yuz berdi.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 'bold' }}>Kitoblarni Excel Orqali Qo'shish</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Kitoblarni ommaviy qo'shish uchun, iltimos, kerakli ustunlarga ega Excel faylini yuklang.
          Majburiy ustunlar: <strong>title, author, category</strong>. Ixtiyoriy: <strong>isbn, description, ...</strong>
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <Link href="/templates/books_template.xlsx" download>
            Excel shablonini yuklab olish
          </Link>
        </Typography>
        <Box sx={{ border: '2px dashed', borderColor: 'divider', p: 3, textAlign: 'center', borderRadius: 2 }}>
          <Button variant="contained" component="label" startIcon={<UploadFileIcon />}>
            Fayl Tanlash
            <input type="file" hidden onChange={handleFileChange} accept=".xls,.xlsx" />
          </Button>
          {selectedFile && <Typography sx={{ mt: 2 }}>Tanlangan fayl: {selectedFile.name}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} disabled={loading}>Bekor qilish</Button>
        <Button onClick={handleUpload} variant="contained" disabled={!selectedFile || loading}>
          {loading ? <CircularProgress size={24} /> : "Yuklash va Qo'shish"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkBookUploadModal;
