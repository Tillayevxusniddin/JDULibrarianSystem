import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress, Avatar } from '@mui/material';
import api from '../../api';
import type { Channel } from '../../types';
import toast from 'react-hot-toast';

interface ChannelSettingsProps {
  channel: Channel;
  onChannelUpdated: (updatedChannel: Channel) => void;
}

const ChannelSettings: React.FC<ChannelSettingsProps> = ({ channel, onChannelUpdated }) => {
  const [name, setName] = useState(channel.name);
  const [bio, setBio] = useState(channel.bio || '');
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setLogoImage(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('bio', bio);
    if (logoImage) {
      formData.append('logoImage', logoImage);
    }

    try {
      const response = await api.put('/channels/my-channel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Kanal sozlamalari saqlandi!');
      onChannelUpdated(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Sozlamalarni saqlashda xatolik.");
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = channel.logoImage ? `http://localhost:5000/public${channel.logoImage}` : undefined;

  return (
    <Paper sx={{ p: 3, borderRadius: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Kanal Sozlamalari</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar src={logoUrl} sx={{ width: 80, height: 80 }} />
          <Button variant="outlined" component="label">
            Logotipni o'zgartirish
            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
          </Button>
        </Box>
        <TextField label="Kanal Nomi" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Kanal Haqida (Bio)" multiline rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Saqlash"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChannelSettings;
