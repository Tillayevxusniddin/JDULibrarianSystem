import React, { useState, useEffect } from 'react';
import { Box, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import api from '../../api';
import type { Category } from '../../types';

interface BookFilterProps {
  onFilterChange: (filters: { search: string; categoryId: string }) => void;
}

const BookFilter: React.FC<BookFilterProps> = ({ onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  // Komponent ilk bor ishga tushganda kategoriyalar ro'yxatini olamiz
  useEffect(() => {
    api.get('/categories').then(response => {
      setCategories(response.data);
    });
  }, []);

  // Har safar qidiruv yoki filtr o'zgarganda, asosiy sahifaga xabar beramiz
  useEffect(() => {
    // Foydalanuvchi yozishni tugatishini kutish uchun kichik pauza (debounce)
    const timer = setTimeout(() => {
      onFilterChange({ search: searchTerm, categoryId: selectedCategory });
    }, 500); // 500 millisekund

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, onFilterChange]);

  return (
    <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {/* Qidiruv maydoni */}
        <Box>
          <TextField
            fullWidth
            label="Sarlavha yoki muallif bo'yicha qidiruv"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>
        
        {/* Kategoriya tanlash */}
        <Box>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Kategoriya bo'yicha filtrlash</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Kategoriya bo'yicha filtrlash"
            >
              <MenuItem value="">
                <em>Barcha Kategoriyalar</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

export default BookFilter;