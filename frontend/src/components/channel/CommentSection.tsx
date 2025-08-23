import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, Divider } from '@mui/material';
import api from '../../api';
import { socket } from '../../api/socket';
import type { PostComment } from '../../types';
import CommentItem from './CommentItem';
import toast from 'react-hot-toast';

interface CommentSectionProps {
  postId: string;
  channelOwnerId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, channelOwnerId }) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get(`/comments/post/${postId}`);
      setComments(response.data.data);
    } catch (error) {
      toast.error("Izohlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
    socket.emit('joinPostComments', postId);

    const handleNewComment = (comment: PostComment) => {
      setComments(prev => comment.parentId ? prev.map(c => c.id === comment.parentId ? { ...c, replies: [...c.replies, comment] } : c) : [...prev, comment]);
    };
    const handleCommentDeleted = ({ commentId, parentId }: { commentId: string, parentId: string | null }) => {
      setComments(prev => parentId ? prev.map(c => c.id === parentId ? { ...c, replies: c.replies.filter(r => r.id !== commentId) } : c) : prev.filter(c => c.id !== commentId));
    };

    socket.on('new_comment', handleNewComment);
    socket.on('comment_deleted', handleCommentDeleted);

    return () => {
      socket.emit('leavePostComments', postId);
      socket.off('new_comment', handleNewComment);
      socket.off('comment_deleted', handleCommentDeleted);
    };
  }, [postId, fetchComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    try {
      await api.post('/comments', {
        content: newComment,
        postId: postId,
        parentId: replyTo ? replyTo.id : null,
      });
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      toast.error("Izoh yuborishda xatolik yuz berdi.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
        await api.delete(`/comments/${commentId}`);
    } catch (error) {
        toast.error("Izohni o'chirishda xatolik yuz berdi.");
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="h6" sx={{ mb: 2 }}>Izohlar</Typography>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          multiline
          label={replyTo ? `${replyTo.user.firstName}ga javob yozish...` : "O'z fikringizni bildiring..."}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 1 }}>
            {replyTo && <Button size="small" onClick={() => setReplyTo(null)}>Bekor qilish</Button>}
            <Button variant="contained" onClick={handleSubmitComment}>Yuborish</Button>
        </Box>
      </Box>

      {loading ? <CircularProgress /> : (
        comments.map(comment => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            onReply={setReplyTo}
            onDelete={handleDeleteComment}
            channelOwnerId={channelOwnerId}
          />
        ))
      )}
    </Box>
  );
};

export default CommentSection;
