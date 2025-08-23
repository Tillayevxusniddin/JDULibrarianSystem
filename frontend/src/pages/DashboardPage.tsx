import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Box, CircularProgress, Pagination } from '@mui/material';
import { useAuthStore } from '../store/auth.store';
import { motion } from 'framer-motion';
import api from '../api';
import toast from 'react-hot-toast';
import type { Post, PaginatedResponse, Channel } from '../types';
import PostCard from '../components/channel/PostCard';
import CommentDrawer from '../components/channel/CommentDrawer';
import EditPostModal from '../components/channel/EditPostModal';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [feed, setFeed] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Post>>('/feed', {
        params: { page, limit: 10 },
      });
      setFeed(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (error) {
      toast.error('Lentani yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (user?.role === 'USER') {
      fetchFeed();
    } else {
      setLoading(false);
    }
  }, [fetchFeed, user]);

  const handlePostUpdated = (updatedPost: Post) => {
    setFeed(feed.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  if (user?.role === 'LIBRARIAN' || user?.role === 'MANAGER') {
    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Xush kelibsiz, {user?.firstName}!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
                Bu sizning shaxsiy boshqaruv panelingiz.
            </Typography>
        </Box>
    );
  }

  return (
    <>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
          Asosiy Lenta
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : feed.length > 0 ? (
          <>
            {/* --- YECHIM SHU YERDA: Postlarni markazga keltiruvchi konteyner --- */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {feed.map(post => (
                <motion.div 
                    key={post.id} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                >
                  <PostCard
                    post={post}
                    channel={post.channel as Channel}
                    onDelete={() => fetchFeed()}
                    onEdit={setPostToEdit}
                    onCommentClick={setCommentPost}
                  />
                </motion.div>
              ))}
            </Box>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} color="primary" />
              </Box>
            )}
          </>
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: 'center', p: 4 }}>
            Sizning lentangiz bo'sh. Qiziqarli kanallarga obuna bo'ling!
          </Typography>
        )}
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

export default DashboardPage;
