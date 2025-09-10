import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, CircularProgress, TextField, Button, Avatar, Paper, Alert, Divider, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import api from '../../api';
import { socket } from '../../api/socket';
import type { Post, PostComment } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import CommentItem from './CommentItem';
import toast from 'react-hot-toast';

interface CommentSectionProps {
  post: Post | null;
}

const CommentSection: React.FC<CommentSectionProps> = ({ post }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const commentListRef = useRef<HTMLDivElement>(null);

  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);

  const fetchComments = useCallback(async () => {
    if (!post) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/comments/post/${post.id}`);
      setComments(response.data.data || []);
    } catch (err) {
      setError("Izohlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [post]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (post) {
      socket.emit('joinPostComments', post.id);

      const handleNewComment = (comment: PostComment) => {
        setComments(prev => {
          if (comment.parentId) {
            const addReply = (list: PostComment[]): PostComment[] => list.map(c => c.id === comment.parentId ? { ...c, replies: [...(c.replies || []), comment] } : (c.replies ? { ...c, replies: addReply(c.replies) } : c));
            return addReply(prev);
          }
          return [comment, ...prev];
        });
      };
      const handleCommentDeleted = ({ commentId }: { commentId: string }) => {
        const removeById = (list: PostComment[]): PostComment[] => list.filter(c => c.id !== commentId).map(c => (c.replies ? { ...c, replies: removeById(c.replies) } : c));
        setComments(prev => removeById(prev));
      };

      socket.on('new_comment', handleNewComment);
      socket.on('comment_deleted', handleCommentDeleted);

      return () => {
        socket.emit('leavePostComments', post.id);
        socket.off('new_comment', handleNewComment);
        socket.off('comment_deleted', handleCommentDeleted);
      };
    }
  }, [post]);

  const handleScrollToComment = (commentId: string) => {
    const element = document.getElementById(`comment-${commentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.transition = 'background-color 0.5s ease';
      element.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 2000);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !post) return;
    setSubmitting(true);
    try {
      await api.post('/comments', {
        content: newComment,
        postId: post.id,
        parentId: replyTo?.id || null,
      });
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      toast.error("Izoh yuborishda xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/comments/${commentId}`);
      toast.success('Izoh o\'chirildi');
    } catch (error) {
      toast.error("Izohni o'chirishda xatolik yuz berdi.");
    }
  };

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Muhokama</Typography>
      </Box>
      <Box ref={commentListRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          : error ? <Alert severity="error">{error}</Alert>
          : comments.length === 0 ? <Typography color="text.secondary" textAlign="center" sx={{ pt: 4 }}>Hali izohlar yo'q. Birinchi bo'ling!</Typography>
          : <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  allComments={comments}
                  onReply={setReplyTo}
                  onDelete={handleDeleteComment}
                  onScrollToComment={handleScrollToComment}
                  channelOwnerId={post?.channel?.ownerId}
                />
              ))}
            </Box>
        }
      </Box>
      <Divider />
      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
        {replyTo && (
          <Paper elevation={0} sx={{ mb: 1.5, p: 1, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              <span style={{ fontWeight: 'bold' }}>{replyTo.user.firstName}</span>ga javob...
            </Typography>
            <IconButton size="small" onClick={() => setReplyTo(null)}><CloseIcon fontSize="inherit" /></IconButton>
          </Paper>
        )}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Avatar src={user?.profilePicture ? `http://localhost:5000${user.profilePicture}` : undefined}>
            {user?.firstName?.charAt(0)}
          </Avatar>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Izohingizni yozing..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={submitting}
            size="small"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
          />
          <Button variant="contained" onClick={handleSubmitComment} disabled={!newComment.trim() || submitting} sx={{ minWidth: 'auto', p: 1 }}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default CommentSection;
