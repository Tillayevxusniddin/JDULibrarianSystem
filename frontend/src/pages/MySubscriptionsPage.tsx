import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Paper, Avatar, Link } from '@mui/material';
import api from '../api';
import type { Channel } from '../types';

const MySubscriptionsPage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      try {
        // --- O'ZGARISH: API manzili to'g'rilandi ---
        const response = await api.get('/channels/me/subscriptions');
        setChannels(response.data.data);
      } catch (err) {
        setError('Obunalarni yuklashda xatolik yuz berdi.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Mening Obunalarim
      </Typography>
      {channels.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {channels.map(channel => (
            <Paper key={channel.id} sx={{ p: 2, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
              <Avatar 
                src={channel.logoImage ? `http://localhost:5000/public${channel.logoImage}` : undefined}
                sx={{ width: 56, height: 56 }}
              >
                {channel.name.charAt(0)}
              </Avatar>
              <Box>
                <Link component={RouterLink} to={`/channels/${channel.linkName}`} underline="hover" sx={{ color: 'text.primary' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{channel.name}</Typography>
                </Link>
                <Typography variant="body2" color="text.secondary">
                  by {channel.owner?.firstName} {channel.owner?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {channel._count?.followers} obunachi
                </Typography>
              </Box>
            </Paper>
          ))}
        </div>
      ) : (
        <Typography color="text.secondary" sx={{ textAlign: 'center', p: 4 }}>
          Siz hali hech qaysi kanalga obuna bo'lmagansiz.
        </Typography>
      )}
    </Box>
  );
};

export default MySubscriptionsPage;