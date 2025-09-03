import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import api from '../../api';
import type { Channel } from '../../types';
import toast from 'react-hot-toast';

interface CreateChannelFormProps {
  onSuccess: (newChannel: Channel) => void;
}

const CreateChannelForm: React.FC<CreateChannelFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [linkName, setLinkName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLinkNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Faqat ruxsat etilgan belgilarni qoldiramiz
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setLinkName(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/channels', { name, linkName, bio });
      toast.success('Kanal muvaffaqiyatli yaratildi!');
      onSuccess(response.data.data);
    } catch (error: any) {
      const message = error.response?.data?.message || "Kanal yaratishda xatolik yuz berdi.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
            O'z Kanalingizni Yarating
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
            O'z fikrlaringizni boshqalar bilan baham ko'ring.
          </Typography>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              label="Kanal Nomi"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Unikal Havola Nomi"
              fullWidth
              required
              value={linkName}
              onChange={handleLinkNameChange}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.5 }}>@</Typography>,
              }}
              helperText="Faqat lotin harflari, sonlar va pastki chiziq."
            />
            <TextField
              label="Kanal Haqida Qisqacha (Bio)"
              fullWidth
              multiline
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !name || !linkName}
              >
                {loading ? <CircularProgress size={24} /> : "Yaratish"}
              </Button>
            </Box>
          </form>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default CreateChannelForm;
