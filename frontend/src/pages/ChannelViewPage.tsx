import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Avatar, Button } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import api from '../api';
import type { Channel, Post } from '../types';
import PostCard from '../components/channel/PostCard';
import CommentDrawer from '../components/channel/CommentDrawer';
import EditPostModal from '../components/channel/EditPostModal';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

const ChannelViewPage: React.FC = () => {
  const { linkName } = useParams<{ linkName: string }>();
  const { user } = useAuthStore();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null); // Scroll uchun ref

  const fetchChannel = useCallback(async () => {
    if (!linkName) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/channels/${linkName}`);
      if (!response.data.data) {
        throw new Error('Kanal topilmadi');
      }
      const fetchedChannel = response.data.data;
      if (fetchedChannel.posts) {
        fetchedChannel.posts.reverse();
      }
      setChannel(fetchedChannel);
    } catch (err: any) {
      setError(err.message || 'Kanalni yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }, [linkName]);

  useEffect(() => {
    fetchChannel();
  }, [fetchChannel]);

  // Sahifa yuklanganda va postlar o'zgarganda pastga scroll qilish
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [channel, loading]);

  const handleToggleFollow = async () => {
    if (!user) {
        toast.error("Obuna bo'lish uchun tizimga kiring.");
        return;
    }
    if (!channel) return;

    const originalChannel = { ...channel };
    const newFollowStatus = !channel.isFollowed;
    const newFollowerCount = channel.isFollowed 
        ? (channel._count?.followers ?? 1) - 1 
        : (channel._count?.followers ?? 0) + 1;

    setChannel({
        ...channel,
        isFollowed: newFollowStatus,
        _count: { followers: newFollowerCount }
    });

    try {
        await api.post(`/channels/${channel.id}/toggle-follow`);
    } catch (error) {
        toast.error("Amalni bajarishda xatolik yuz berdi.");
        setChannel(originalChannel);
    }
  };

  const handlePostUpdated = (updatedPost: Post) => {
    if (channel && channel.posts) {
        setChannel({
            ...channel,
            posts: channel.posts.map(p => p.id === updatedPost.id ? updatedPost : p)
        });
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }
  if (!channel) return null;

  // const ownerAvatarUrl = channel.owner?.profilePicture ? `http://localhost:5000/public${channel.owner.profilePicture}` : undefined;
  const logoUrl = channel.logoImage ? `http://localhost:5000/public${channel.logoImage}` : undefined;
  const isMyChannel = user?.id === channel.ownerId;

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)' }}>
        {/* Kanal Sarlavhasi */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={logoUrl} sx={{ width: 56, height: 56 }}>
                {channel.owner?.firstName.charAt(0)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{channel.name}</Typography>
                <Typography color="text.secondary">@{channel.linkName} · {channel._count?.followers} obunachi</Typography>
                </Box>
                {user && !isMyChannel && (
                <Button
                    variant={channel.isFollowed ? "outlined" : "contained"}
                    startIcon={channel.isFollowed ? <HowToRegIcon /> : <PersonAddIcon />}
                    onClick={handleToggleFollow}
                >
                    {channel.isFollowed ? "Obuna bo'lingan" : "Obuna bo'lish"}
                </Button>
                )}
                {isMyChannel && (
                <Button component={RouterLink} to="/my-channel" variant="contained">
                    Kanalni Boshqarish
                </Button>
                )}
            </Box>
        </Box>

        {/* Postlar Lentasi */}
        <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {channel.posts && channel.posts.length > 0 ? (
                    channel.posts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        channel={channel}
                        onDelete={() => {}} // Bu sahifada o'chirish yo'q
                        onEdit={setPostToEdit}
                        onCommentClick={setCommentPost}
                    />
                    ))
                ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', p: 4 }}>
                    Bu kanalda hali postlar mavjud emas.
                    </Typography>
                )}
            </Box>
        </Box>
      </Box>

      <CommentDrawer 
        post={commentPost}
        open={!!commentPost}
        onClose={() => setCommentPost(null)}
      />
      <EditPostModal
        post={postToEdit}
        open={!!postToEdit}
        onClose={() => setPostToEdit(null)}
        onPostUpdated={handlePostUpdated}
      />
    </>
  );
};

export default ChannelViewPage;
