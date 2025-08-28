import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Typography, Box, FormHelperText } from '@mui/material';
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
  const [newCategoryMode, setNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
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
        categoryId: book.category?.id || '',
        isbn: book.isbn || '', // <-- ISBN'ni o'rnatish
        totalCopies: typeof book.totalCopies === 'number' ? book.totalCopies : 1,
        availableCopies:
          typeof book.availableCopies === 'number'
            ? book.availableCopies
            : 1,
      });
    } else {
      setFormData({
        title: '',
        author: '',
        description: '',
        categoryId: '',
        isbn: '',
        totalCopies: 1,
        availableCopies: 1,
      }); // <-- ISBN'ni bo'shatish
    }
    setCoverImage(null);
    setNewCategoryMode(false);
    setNewCategoryName('');
  }, [book, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<any>,
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    if (name === 'categoryId') {
      if (value === '__create__') {
        setNewCategoryMode(true);
        setFormData({ ...formData, categoryId: '' });
        return;
      } else {
        setNewCategoryMode(false);
      }
    }
    if (name === 'totalCopies' || name === 'availableCopies') {
      const num = value === '' ? '' : Math.max(0, Math.floor(Number(value)));
      const draft = { ...formData, [name]: num } as any;
      // Keep available <= total (only for local UI; backend also enforces)
      if (name === 'totalCopies' && typeof draft.availableCopies === 'number' && typeof num === 'number' && draft.availableCopies > num) {
        draft.availableCopies = num;
      }
      setFormData(draft);
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const data = new FormData();
    let resolvedCategoryId = formData.categoryId as string | undefined;

    // If user chose to create a new category, create it first
    if (newCategoryMode && newCategoryName.trim()) {
      try {
        const resp = await api.post<Category>('/categories', { name: newCategoryName.trim() });
        resolvedCategoryId = resp.data.id;
      } catch (err: any) {
        setLoading(false);
        const msg = err?.response?.data?.message || 'Kategoriyani yaratishda xatolik.';
        return toast.error(msg);
      }
    }
    // Normalize copy counts before sending
    const total = Number(formData.totalCopies ?? 1) || 1;
    let available = Number(formData.availableCopies ?? total) || total;
    if (available > total) available = total;

    const payload = {
      ...formData,
      totalCopies: total,
      availableCopies: available,
      categoryId: resolvedCategoryId,
    };

    // Faqat bo'sh bo'lmagan maydonlarni yuboramiz
    Object.keys(payload).forEach((key) => {
      const val = (payload as any)[key];
      if (val !== undefined && val !== '') {
        data.append(key, String(val));
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
          <TextField name="author" label="Muallif (ixtiyoriy)" value={formData.author || ''} onChange={handleChange} fullWidth />
          {/* --- YANGI MAYDON --- */}
          <TextField name="isbn" label="ISBN (Ixtiyoriy)" value={formData.isbn || ''} onChange={handleChange} fullWidth />
          {/* --- TUGADI --- */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              name="totalCopies"
              label="Jami nusxalar"
              type="number"
              inputProps={{ min: 1 }}
              value={formData.totalCopies ?? 1}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="availableCopies"
              label="Mavjud nusxalar"
              type="number"
              inputProps={{ min: 0 }}
              value={formData.availableCopies ?? formData.totalCopies ?? 1}
              onChange={handleChange}
              fullWidth
              helperText="Mavjud nusxalar jami nusxalardan oshmasin"
            />
          </Box>
          <FormControl fullWidth>
            <InputLabel>Kategoriya</InputLabel>
            <Select name="categoryId" value={newCategoryMode ? '__create__' : (formData.categoryId || '')} label="Kategoriya" onChange={handleChange}>
              <MenuItem value="__create__">+ Yangi kategoriya qo'shish</MenuItem>
              {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
            </Select>
            {newCategoryMode && (
              <Box sx={{ mt: 1 }}>
                <TextField
                  label="Yangi kategoriya nomi"
                  fullWidth
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <FormHelperText>Saqlash tugmasini bosganda kategoriya yaratiladi</FormHelperText>
              </Box>
            )}
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
