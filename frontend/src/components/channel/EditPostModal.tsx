import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, CircularProgress,  } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
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
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (post) {
      setContent(post.content);
      setImagePreview(post.postImage ? `http://localhost:5000${post.postImage}` : null);
      setNewImage(null); // Har safar oyna ochilganda yangi tanlangan faylni tozalaymiz
    }
  }, [post]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!post || !content.trim()) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('content', content);
    if (newImage) {
      formData.append('postImage', newImage);
    }

    try {
      const response = await api.put(`/posts/${post.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Post muvaffaqiyatli yangilandi!');
      onPostUpdated(response.data.data);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Postni yangilashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Postni Tahrirlash</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {imagePreview && (
                <Box sx={{ position: 'relative', width: 150, mb: 1 }}>
                    <Box component="img" src={imagePreview} alt="Preview" sx={{ width: '100%', borderRadius: (t) => t.customShape.radius.sm }} />
                </Box>
            )}
            <TextField
            autoFocus
            label="Post matni"
            type="text"
            fullWidth
            multiline
            rows={5}
            variant="outlined"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            />
            <Button variant="outlined" component="label" startIcon={<PhotoCameraIcon />}>
                Rasmni o'zgartirish
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
            </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: (t) => t.spacing(2, 3) }}>
        <Button onClick={onClose}>Bekor qilish</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Saqlash"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPostModal;
