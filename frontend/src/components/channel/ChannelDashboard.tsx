// src/components/channel/ChannelDashboard.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import api from '../../api';
import type { Channel, Post } from '../../types';
import CreatePostForm from './CreatePostForm';
import PostCard from './PostCard';
import EditPostModal from './EditPostModal';
import ChannelSettings from './ChannelSettings';
import CommentDrawer from './CommentDrawer';
import toast from 'react-hot-toast';

interface ChannelDashboardProps {
  initialChannel: Channel;
}

const ChannelDashboard: React.FC<ChannelDashboardProps> = ({ initialChannel }) => {
  const [channel, setChannel] = useState(initialChannel);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'posts' | 'settings'>('posts');
  
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/posts/channel/${channel.id}`);
      setPosts(response.data.data.reverse());
    } catch (error) {
      toast.error("Postlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [channel.id]);

  useEffect(() => {
    if (view === 'posts') {
      fetchPosts();
    }
  }, [fetchPosts, view]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [posts, loading]);

  const handlePostCreated = (newPost: Post) => {
    setPosts(prevPosts => [...prevPosts, newPost]);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    try {
        await api.delete(`/posts/${postToDelete}`);
        toast.success("Post muvaffaqiyatli o'chirildi.");
        setPosts(posts.filter(p => p.id !== postToDelete));
    } catch (error) {
        toast.error("Postni o'chirishda xatolik yuz berdi.");
    } finally {
        setPostToDelete(null);
    }
  };

  return (
    // --- LAYOUT O'ZGARISHLARI: Asosiy flex konteyner ---
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', bgcolor: 'background.paper', borderRadius: 2 }}>
      {/* 1. YUQORI QISM (SARLAVHA) - qotib turadi */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{channel.name}</Typography>
            <Typography variant="body2" color="text.secondary">@{channel.linkName}</Typography>
          </Box>
          <Button 
            variant={view === 'settings' ? "contained" : "outlined"}
            startIcon={<SettingsIcon />} 
            onClick={() => setView(view === 'posts' ? 'settings' : 'posts')}
          >
            {view === 'posts' ? 'Sozlamalar' : 'Lentaga qaytish'}
          </Button>
        </Box>
      </Box>

      {view === 'posts' ? (
        <>
          {/* 2. O'RTA QISM (KONTENT) - faqat shu joy scroll bo'ladi */}
          <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 1, sm: 2 } }}>
            <Box sx={{ maxWidth: 700, mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {loading ? <CircularProgress sx={{ my: 4 }} /> : (
                posts.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                    {posts.map(post => (
                      <PostCard 
                        key={post.id} 
                        post={post} 
                        channel={channel} 
                        onDelete={setPostToDelete} 
                        onEdit={setPostToEdit} 
                        onCommentClick={setCommentPost} 
                      />
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">📝 Bu kanalda hali postlar mavjud emas</Typography>
                    <Typography variant="body2" color="text.secondary">Birinchi postingizni yarating!</Typography>
                  </Box>
                )
              )}
            </Box>
          </Box>
          {/* 3. PASTKI QISM (FORMA) - qotib turadi */}
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0, bgcolor: 'background.paper' }}>
            <Box sx={{ maxWidth: 700, mx: 'auto' }}>
                <CreatePostForm onPostCreated={handlePostCreated} />
            </Box>
          </Box>
        </>
      ) : (
        <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
          <ChannelSettings channel={channel} onChannelUpdated={setChannel} />
        </Box>
      )}

      <Dialog open={!!postToDelete} onClose={() => setPostToDelete(null)}>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent><Typography>Haqiqatan ham bu postni o'chirmoqchimisiz?</Typography></DialogContent>
        <DialogActions>
            <Button onClick={() => setPostToDelete(null)}>Bekor qilish</Button>
            <Button onClick={handleDeleteConfirm} color="error">O'chirish</Button>
        </DialogActions>
      </Dialog>
      <EditPostModal post={postToEdit} open={!!postToEdit} onClose={() => setPostToEdit(null)} onPostUpdated={handlePostUpdated} />
      <CommentDrawer post={commentPost} open={!!commentPost} onClose={() => setCommentPost(null)} />
    </Box>
  );
};

export default ChannelDashboard;