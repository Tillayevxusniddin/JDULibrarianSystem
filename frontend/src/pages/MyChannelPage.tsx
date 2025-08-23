import React, { useState, useEffect } from 'react';
import { Box, CircularProgress} from '@mui/material';
import api from '../api';
import type { Channel } from '../types';
import CreateChannelForm from '../components/channel/CreateChannelForm'; // Buni keyingi qadamda yaratamiz
import ChannelDashboard from '../components/channel/ChannelDashboard'; // Buni keyinroq yaratamiz

const MyChannelPage: React.FC = () => {
  const [channel, setChannel] = useState<Channel | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyChannel = async () => {
      try {
        setLoading(true);
        const response = await api.get('/channels/my-channel');
        setChannel(response.data.data); // Agar kanal bo'lmasa, bu null bo'ladi
      } catch (error) {
        console.error("Kanalni yuklashda xatolik:", error);
        setChannel(null); // Xatolik bo'lsa ham, kanal yo'q deb hisoblaymiz
      } finally {
        setLoading(false);
      }
    };
    fetchMyChannel();
  }, []);

  const handleChannelCreated = (newChannel: Channel) => {
    setChannel(newChannel);
  };

  if (loading || channel === undefined) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      {channel ? (
        // Agar kanal mavjud bo'lsa, boshqaruv panelini ko'rsatamiz
        <ChannelDashboard initialChannel={channel} />
        // <Typography variant="h4">Kanal Boshqaruv Paneli (Keyingi qadamda yaratiladi)</Typography>
      ) : (
        // Agar kanal mavjud bo'lmasa, yaratish formasini ko'rsatamiz
        <CreateChannelForm onSuccess={handleChannelCreated} />
      )}
    </Box>
  );
};

export default MyChannelPage;
