import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Button, Paper, Avatar, Divider, Link } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../api';
import type { Post } from '../types';
import { useChannelScroll } from '../hooks/useChannelScroll';
import CommentSection from '../components/channel/CommentSection';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import ReactionSection from '../components/channel/ReactionSection';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  useChannelScroll();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/posts/${postId}`);
      setPost(response.data.data);
    } catch (err: any) {
      setError('Postni yuklashda xatolik yuz berdi yoki post topilmadi.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!post) return null;

  const postImageUrl = post.postImage ? `http://localhost:5000${post.postImage}` : null;
  const channelLogoUrl = post.channel?.logoImage ? `http://localhost:5000${post.channel.logoImage}` : undefined;

  return (
    <div className="h-full overflow-hidden">
      <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-12">
        {/* CHAP USTUN: Post kontenti */}
        <div className="h-full col-span-1 p-4 overflow-y-auto md:col-span-7">
          <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
              Orqaga
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Link component={RouterLink} to={`/channels/${post.channel?.linkName}`}>
                <Avatar src={channelLogoUrl} sx={{ width: 48, height: 48 }}>
                  {post.channel?.name.charAt(0)}
                </Avatar>
              </Link>
              <Box>
                <Link component={RouterLink} to={`/channels/${post.channel?.linkName}`} underline="hover">
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{post.channel?.name}</Typography>
                </Link>
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(post.createdAt), 'd MMMM, yyyy HH:mm', { locale: uz })}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {postImageUrl && (
              <Box sx={{ my: 3, borderRadius: 2, overflow: 'hidden' }}>
                <img src={postImageUrl} alt="Post content" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </Box>
            )}

            <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', my: 3 }}>
              {post.content}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <ReactionSection post={post} />
          </Paper>
        </div>

        {/* O'NG USTUN: Izohlar */}
        <div className="hidden h-full col-span-1 md:col-span-5 md:block">
          <CommentSection post={post} />
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;