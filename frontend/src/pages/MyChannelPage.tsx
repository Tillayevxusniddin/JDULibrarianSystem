import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import api from '../api';
import type { Channel } from '../types';
import { useChannelScroll } from '../hooks/useChannelScroll';
import CreateChannelForm from '../components/channel/CreateChannelForm';
import ChannelDashboard from '../components/channel/ChannelDashboard';

const MyChannelPage: React.FC = () => {
  const [channel, setChannel] = useState<Channel | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Bu hook shu sahifada MainLayout scroll'ini o'chiradi
  useChannelScroll();

  useEffect(() => {
    const fetchMyChannel = async () => {
      try {
        setLoading(true);
        const response = await api.get('/channels/my-channel');
        setChannel(response.data.data);
      } catch (error) {
        setChannel(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMyChannel();
  }, []);

  if (loading || channel === undefined) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ height: '100%' }}>
      {channel ? (
        <ChannelDashboard initialChannel={channel} />
      ) : (
        <CreateChannelForm onSuccess={setChannel} />
      )}
    </Box>
  );
};

export default MyChannelPage;
