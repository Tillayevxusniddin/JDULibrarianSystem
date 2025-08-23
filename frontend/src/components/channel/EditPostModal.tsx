import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress } from '@mui/material';
import api from '../../api';
import type { Post } from '../../types';
import toast from 'react-hot-toast';

interface EditPostModalProps {
  post: Post | null;
  open: boolean;
  onClose: () => void;
  onPostUpdated: (updatedPost: Post) => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ post, open, onClose, onPostUpdated }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (post) {
      setContent(post.content);
    }
  }, [post]);

  const handleSubmit = async () => {
    if (!post || !content.trim()) return;
    setLoading(true);
    try {
      const response = await api.put(`/posts/${post.id}`, { content });
      toast.success('Post muvaffaqiyatli yangilandi!');
      onPostUpdated(response.data.data);
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.message || "Postni yangilashda xatolik yuz berdi.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Postni Tahrirlash</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Post matni"
          type="text"
          fullWidth
          multiline
          rows={5}
          variant="outlined"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose}>Bekor qilish</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Saqlash"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPostModal;
