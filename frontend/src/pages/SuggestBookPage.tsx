// src/pages/SuggestBookPage.tsx
import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress, Stepper, Step, StepLabel } from '@mui/material';
import { motion } from 'framer-motion';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BookIcon from '@mui/icons-material/Book';
import PersonIcon from '@mui/icons-material/Person';
import NotesIcon from '@mui/icons-material/Notes';

const steps = ['Kitob ma`lumotlari', 'Qo`shimcha izoh', 'Yuborish'];

const SuggestBookPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/suggestions', { title, author, note });
      toast.success('Taklifingiz ko`rib chiqish uchun yuborildi. Rahmat!');
      setTimeout(() => {
        navigate('/books');
      }, 1500);
    } catch (err) {
      toast.error('Taklif yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
        Yangi Kitob Taklif Qilish
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Kutubxonamizni boyitishga yordam bering.
      </Typography>
      
      <Paper 
        component={motion.div} 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4 }}
      >
        <Stepper activeStep={title ? (note ? 2 : 1) : 0} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BookIcon color="action" />
            <TextField
              label="Kitob Sarlavhasi"
              variant="outlined"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonIcon color="action" />
            <TextField
              label="Muallif (Ixtiyoriy)"
              variant="outlined"
              fullWidth
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <NotesIcon color="action" sx={{ mt: 2 }}/>
            <TextField
              label="Nima uchun bu kitob kerak deb o'ylaysiz? (Ixtiyoriy)"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !title}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Yuborilmoqda...' : 'Taklifni Yuborish'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default SuggestBookPage;
