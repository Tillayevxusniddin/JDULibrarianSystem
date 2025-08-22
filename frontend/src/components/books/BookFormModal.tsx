import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Typography, Box } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import api from '../../api';
import type { Book, Category } from '../../types';
import toast from 'react-hot-toast';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNotificationStore } from '../../store/notification.store';

interface BookFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  book: Book | null;
}

const BookFormModal: React.FC<BookFormModalProps> = ({ open, onClose, onSuccess, book }) => {
  const [formData, setFormData] = useState<any>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const isEditing = book !== null;
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  useEffect(() => {
    if (open) {
      api.get<Category[]>('/categories').then(res => setCategories(res.data));
    }
    
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        description: book.description || '',
        categoryId: book.category.id || '',
        isbn: book.isbn || '', // <-- ISBN'ni o'rnatish
      });
    } else {
      setFormData({ title: '', author: '', description: '', categoryId: '', isbn: '' }); // <-- ISBN'ni bo'shatish
    }
    setCoverImage(null);
  }, [book, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<any>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const data = new FormData();
    // Faqat bo'sh bo'lmagan maydonlarni yuboramiz
    Object.keys(formData).forEach(key => {
        if (formData[key]) {
            data.append(key, formData[key])
        }
    });
    if (coverImage) {
      data.append('coverImage', coverImage);
    }

    try {
      if (isEditing) {
        await api.put(`/books/${book.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Kitob muvaffaqiyatli yangilandi!');
      } else {
        await api.post('/books', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Kitob muvaffaqiyatli yaratildi!');
        fetchNotifications(); 
      }
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.message || "Kitobni saqlashda xatolik yuz berdi.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
        {isEditing ? <EditIcon /> : <AddCircleOutlineIcon />}
        {isEditing ? "Kitobni Tahrirlash" : "Yangi Kitob Qo'shish"}
      </DialogTitle>
      <DialogContent sx={{ bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField name="title" label="Sarlavha" value={formData.title || ''} onChange={handleChange} fullWidth required />
          <TextField name="author" label="Muallif" value={formData.author || ''} onChange={handleChange} fullWidth required />
          {/* --- YANGI MAYDON --- */}
          <TextField name="isbn" label="ISBN (Ixtiyoriy)" value={formData.isbn || ''} onChange={handleChange} fullWidth />
          {/* --- TUGADI --- */}
          <FormControl fullWidth required>
            <InputLabel>Kategoriya</InputLabel>
            <Select name="categoryId" value={formData.categoryId || ''} label="Kategoriya" onChange={handleChange}>
              {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField name="description" label="Tavsif" value={formData.description || ''} onChange={handleChange} fullWidth multiline rows={4} />
          <Box>
            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
              Muqova Rasmini Yuklash
              <input type="file" hidden onChange={handleFileChange} accept="image/*" />
            </Button>
            {coverImage && <Typography variant="body2" sx={{ display: 'inline', ml: 2 }}>{coverImage.name}</Typography>}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose}>Bekor qilish</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Saqlash"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookFormModal;
