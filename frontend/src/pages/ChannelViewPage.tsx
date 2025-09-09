import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Avatar, Button, Chip } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import api from '../api';
import type { Channel, Post } from '../types';
import { useAuthStore } from '../store/auth.store';
import { useChannelScroll } from '../hooks/useChannelScroll';
import PostCard from '../components/channel/PostCard';
import CommentDrawer from '../components/channel/CommentDrawer';
import EditPostModal from '../components/channel/EditPostModal';
import toast from 'react-hot-toast';

const ChannelViewPage: React.FC = () => {
  const { linkName } = useParams<{ linkName: string }>();
  const { user } = useAuthStore();
  
  useChannelScroll();
  
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  
  const fetchChannel = useCallback(async () => {
    if (!linkName) return;
    setLoading(true);
    try {
      const response = await api.get(`/channels/${linkName}`);
      setChannel(response.data.data);
    } catch (err: any) {
      setError('Kanal topilmadi yoki yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }, [linkName]);

  useEffect(() => {
    fetchChannel();
  }, [fetchChannel]);

  const handleToggleFollow = async () => {
    if (!user) return toast.error("Obuna bo'lish uchun tizimga kiring.");
    if (!channel) return;

    const originalChannel = { ...channel };
    const newFollowStatus = !channel.isFollowed;
    const newFollowerCount = channel.isFollowed ? (channel._count?.followers ?? 1) - 1 : (channel._count?.followers ?? 0) + 1;

    setChannel(c => c ? { ...c, isFollowed: newFollowStatus, _count: { followers: newFollowerCount } } : null);

    try {
      await api.post(`/channels/${channel.id}/toggle-follow`);
    } catch (error) {
      toast.error("Amalni bajarishda xatolik yuz berdi.");
      setChannel(originalChannel);
    }
  };

  const handlePostUpdated = (updatedPost: Post) => {
    if (channel?.posts) {
      setChannel({ ...channel, posts: channel.posts.map(p => p.id === updatedPost.id ? updatedPost : p) });
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!channel) return null;

  const logoUrl = channel.logoImage ? `http://localhost:5000${channel.logoImage}` : undefined;
  const isMyChannel = user?.id === channel.ownerId;

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={logoUrl} sx={{ width: 56, height: 56 }}>{channel.name.charAt(0)}</Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{channel.name}</Typography>
              <Chip label={`${channel._count?.followers} obunachi`} size="small" sx={{ mt: 1 }} />
            </Box>
            {user && !isMyChannel && (
              <Button variant={channel.isFollowed ? "outlined" : "contained"} startIcon={channel.isFollowed ? <HowToRegIcon /> : <PersonAddIcon />} onClick={handleToggleFollow}>
                {channel.isFollowed ? "A'zo" : "A'zo bo'lish"}
              </Button>
            )}
            {isMyChannel && <Button component={RouterLink} to="/my-channel" variant="contained">Boshqaruv</Button>}
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 1, sm: 2 }, bgcolor: 'action.hover' }}>
          <Box sx={{ maxWidth: 700, mx: 'auto', py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {channel.posts && channel.posts.length > 0 ? (
              channel.posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  channel={channel} 
                  onEdit={() => {}} 
                  onCommentClick={setCommentPost} 
                  onDelete={() => {}} 
                />
              ))
            ) : (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>Bu kanalda hali postlar yo'q.</Typography>
            )}
          </Box>
        </Box>
      </Box>

      <CommentDrawer post={commentPost} open={!!commentPost} onClose={() => setCommentPost(null)} />
      <EditPostModal post={postToEdit} open={!!postToEdit} onClose={() => setPostToEdit(null)} onPostUpdated={handlePostUpdated} />
    </>
  );
};

export default ChannelViewPage;
