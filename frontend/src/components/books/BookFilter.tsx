import React, { useState, useEffect } from 'react';
import { TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
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
    <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Qidiruv maydoni */}
        <div>
          <TextField
            fullWidth
            label="Sarlavha yoki muallif bo'yicha qidiruv"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        {/* Kategoriya tanlash */}
        <div>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Kategoriya bo'yicha filtrlash</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Kategoriya bo'yicha filtrlash"
              className="w-full"
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
        </div>
      </div>
    </div>
  );
};

export default BookFilter;