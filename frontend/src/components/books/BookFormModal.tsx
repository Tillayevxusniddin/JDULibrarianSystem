import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Typography, Box, IconButton, Divider } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import api from '../../api';
import type { Book, Category } from '../../types';
import toast from 'react-hot-toast';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

interface BookFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  book: Book | null;
}

const BookFormModal: React.FC<BookFormModalProps> = ({ open, onClose, onSuccess, book }) => {
  // Kitob "pasporti" ma'lumotlari uchun state
  const [formData, setFormData] = useState<any>({});
  // Shtrix-kodlar ro'yxati uchun state
  const [barcodes, setBarcodes] = useState<string[]>(['']);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const isEditing = book !== null;

  useEffect(() => {
    // Har safar modal ochilganda kategoriyalarni yuklaymiz
    if (open) {
      api.get<Category[]>('/categories').then(res => setCategories(res.data));
    }
    
    // Modal ochilish rejimiga qarab formani to'ldiramiz
    if (isEditing && book) {
      // Tahrirlash rejimi
      setFormData({
        title: book.title || '',
        author: book.author || '',
        description: book.description || '',
        categoryId: book.category.id || '',
      });
    } else {
      // Yangi kitob yaratish rejimi
      setFormData({ title: '', author: '', description: '', categoryId: '' });
      setBarcodes(['']); // Shtrix-kodlar maydonini tozalaymiz
    }
  }, [book, open, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<any>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // --- Shtrix-kodlar bilan ishlash funksiyalari ---
  const handleBarcodeChange = (index: number, value: string) => {
    const newBarcodes = [...barcodes];
    newBarcodes[index] = value;
    setBarcodes(newBarcodes);
  };

  const addBarcodeField = () => {
    setBarcodes([...barcodes, '']);
  };

  const removeBarcodeField = (index: number) => {
    if (barcodes.length > 1) {
      const newBarcodes = barcodes.filter((_, i) => i !== index);
      setBarcodes(newBarcodes);
    }
  };
  // --- Funksiyalar tugadi ---

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isEditing && book) {
        // --- TAHRIRLASH MANTIG'I ---
        await api.put(`/books/${book.id}`, formData);
        toast.success('Kitob ma\'lumotlari muvaffaqiyatli yangilandi!');
      } else {
        // --- YANGI KITOB YARATISH MANTIG'I ---
        const validBarcodes = barcodes.map(b => b.trim()).filter(Boolean);
        if (validBarcodes.length === 0) {
          toast.error("Iltimos, kamida bitta nusxaning shtrix-kodini kiriting.");
          setLoading(false);
          return;
        }

        const dataToSend = {
          ...formData,
          copies: validBarcodes.map(barcode => ({ barcode })),
        };
        
        await api.post('/books', dataToSend);
        toast.success('Yangi kitob va uning nusxalari muvaffaqiyatli yaratildi!');
      }
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.message || "Xatolik yuz berdi.";
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
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {/* Asosiy ma'lumotlar (pasport) */}
          <TextField name="title" label="Sarlavha" value={formData.title || ''} onChange={handleChange} required />
          <TextField name="author" label="Muallif (Ixtiyoriy)" value={formData.author || ''} onChange={handleChange} />
          <FormControl fullWidth required>
            <InputLabel>Kategoriya</InputLabel>
            <Select name="categoryId" value={formData.categoryId || ''} label="Kategoriya" onChange={handleChange}>
              {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField name="description" label="Tavsif (Ixtiyoriy)" value={formData.description || ''} onChange={handleChange} multiline rows={3} />
          
          {/* Faqat Yaratish Rejimida Ko'rinadigan Nusxalar Bo'limi */}
          {!isEditing && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Kitob Nusxalari (Shtrix-kodlar)
                </Typography>
                {barcodes.map((barcode, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <TextField
                      fullWidth
                      label={`Nusxa ${index + 1} shtrix-kodi`}
                      value={barcode}
                      onChange={(e) => handleBarcodeChange(index, e.target.value)}
                      variant="outlined"
                      size="small"
                      required
                    />
                    <IconButton onClick={() => removeBarcodeField(index)} disabled={barcodes.length === 1} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button startIcon={<AddIcon />} onClick={addBarcodeField} size="small" variant="outlined">
                  Yana nusxa qo'shish
                </Button>
              </Box>
            </>
          )}

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