// src/components/books/BookFilter.tsx

import React, { useState, useEffect, useRef } from 'react'; // useRef'ni import qilamiz
import { TextField, Select, MenuItem, FormControl, InputLabel, Paper, Box } from '@mui/material';
import api from '../../api';
import type { Category } from '../../types';

interface BookFilterProps {
  onFilterChange: (filters: { search: string; categoryId: string; availability: string }) => void;
}

const BookFilter: React.FC<BookFilterProps> = ({ onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availability, setAvailability] = useState('available');
  const [categories, setCategories] = useState<Category[]>([]);

  // --- O'ZGARISH: "Bayroqcha" yaratamiz ---
  const isInitialMount = useRef(true);

  useEffect(() => {
    api.get('/categories').then(response => {
      setCategories(response.data);
    });
  }, []);

  useEffect(() => {
    // --- O'ZGARISH: Birinchi renderda bu qismni o'tkazib yuboramiz ---
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      onFilterChange({ search: searchTerm, categoryId: selectedCategory, availability });
    }, 500); // 500 millisekund

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, availability, onFilterChange]);

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: 2,
        mb: 3,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        backgroundImage: 'none',
      })}
    >
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
        }}
      >
        <TextField fullWidth label="Qidiruv" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <FormControl fullWidth>
          <InputLabel>Kategoriya</InputLabel>
          <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} label="Kategoriya">
            <MenuItem value=""><em>Barchasi</em></MenuItem>
            {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Mavjudligi</InputLabel>
          <Select value={availability} onChange={(e) => setAvailability(e.target.value)} label="Mavjudligi">
            <MenuItem value=""><em>Barchasi</em></MenuItem>
            <MenuItem value="available">Mavjud</MenuItem>
            <MenuItem value="borrowed">Band</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
};

export default BookFilter;
