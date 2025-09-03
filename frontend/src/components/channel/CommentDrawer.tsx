import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, Drawer, IconButton, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import api from '../../api';
import { socket } from '../../api/socket';
import type { PostComment, Post } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';

interface CommentItemProps {
  comment: PostComment;
  isOwnComment: boolean;
}

// Bitta izohni "chat pufakchasi" ko'rinishida chizadi
const CommentItem: React.FC<CommentItemProps> = ({ comment, isOwnComment }) => {
    const avatarUrl = comment.user.profilePicture ? `http://localhost:5000/public${comment.user.profilePicture}` : undefined;
    return (
        <Box sx={{
            display: 'flex',
            justifyContent: isOwnComment ? 'flex-end' : 'flex-start',
            mb: 2,
        }}>
            <Box sx={{ display: 'flex', flexDirection: isOwnComment ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 1, maxWidth: '80%' }}>
                <Avatar src={avatarUrl} sx={{ width: 32, height: 32 }}>
                    {comment.user.firstName.charAt(0)}
                </Avatar>
                <Box sx={{
                    bgcolor: isOwnComment ? 'primary.main' : 'background.paper',
                    color: isOwnComment ? 'primary.contrastText' : 'text.primary',
                    p: 1.5,
                    borderRadius: (t) => t.customShape.radius.md,
                    borderTopLeftRadius: (t) => (isOwnComment ? t.customShape.radius.lg : t.customShape.radius.sm),
                    borderTopRightRadius: (t) => (isOwnComment ? t.customShape.radius.sm : t.customShape.radius.lg),
                }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                        {comment.user.firstName} {comment.user.lastName}
                    </Typography>
                    <Typography variant="body2">{comment.content}</Typography>
                </Box>
            </Box>
        </Box>
    );
}


interface CommentDrawerProps {
  post: Post | null;
  open: boolean;
  onClose: () => void;
}

const CommentDrawer: React.FC<CommentDrawerProps> = ({ post, open, onClose }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    if (!post) return;
    setLoading(true);
    try {
      const response = await api.get(`/comments/post/${post.id}`);
      setComments(response.data.data);
    } catch (error) {
      toast.error("Izohlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [post]);

  useEffect(() => {
    if (open) {
      fetchComments();
      socket.emit('joinPostComments', post!.id);
    }

    const handleNewComment = (comment: PostComment) => {
      if (comment.postId === post?.id) {
        setComments(prev => [...prev, comment]);
      }
    };

    socket.on('new_comment', handleNewComment);

    return () => {
      if (post) {
        socket.emit('leavePostComments', post.id);
      }
      socket.off('new_comment', handleNewComment);
    };
  }, [post, open, fetchComments]);

  // Har safar yangi izoh kelganda pastga scroll qilish
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);


  const handleSubmitComment = async () => {
    if (!newComment.trim() || !post) return;
    try {
      await api.post('/comments', {
        content: newComment,
        postId: post.id,
      });
      setNewComment('');
    } catch (error) {
      toast.error("Izoh yuborishda xatolik yuz berdi.");
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 400 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Sarlavha */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Izohlar</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        {/* Izohlar lentasi */}
        <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
          {loading ? <CircularProgress sx={{ display: 'block', m: 'auto' }} /> : (
            comments.length > 0 ? (
              comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} isOwnComment={user?.id === comment.user.id} />
              ))
            ) : (
              <Typography color="text.secondary" sx={{ textAlign: 'center' }}>Hali izohlar mavjud emas.</Typography>
            )
          )}
        </Box>

        {/* Izoh yozish formasi */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              variant="outlined"
              placeholder="Izoh yozing..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              size="small"
            />
            <Button variant="contained" onClick={handleSubmitComment} sx={{ p: 1 }}>
              <SendIcon />
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CommentDrawer;
