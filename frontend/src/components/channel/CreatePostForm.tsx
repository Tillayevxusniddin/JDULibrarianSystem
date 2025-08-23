import React, { useState, useRef } from 'react';
import { Box, TextField, Button, CircularProgress, Avatar, IconButton} from '@mui/material';
import { useAuthStore } from '../../store/auth.store';
import api from '../../api';
import toast from 'react-hot-toast';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import type { Post } from '../../types';

interface CreatePostFormProps {
  onPostCreated: (newPost: Post) => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPostImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Fayl tanlash maydonini tozalash
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !postImage) {
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('content', content);
    if (postImage) {
      formData.append('postImage', postImage);
    }

    try {
      const response = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onPostCreated(response.data.data);
      setContent('');
      removeImage();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Post yaratishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const avatarUrl = user?.profilePicture ? `http://localhost:5000/public${user.profilePicture}` : undefined;

  return (
    <Box>
      {imagePreview && (
        <Box sx={{ position: 'relative', width: 100, mb: 1 }}>
          <img src={imagePreview} alt="Preview" style={{ width: '100%', borderRadius: '8px' }} />
          <IconButton onClick={removeImage} size="small" sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.200' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar src={avatarUrl}>{user?.firstName.charAt(0)}</Avatar>
        <TextField
          fullWidth
          multiline
          maxRows={5}
          variant="outlined"
          placeholder="Xabar yozing..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '20px' } }}
        />
        <IconButton color="primary" component="label" disabled={loading}>
          <PhotoCameraIcon />
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
        </IconButton>
        <Button variant="contained" onClick={handleSubmit} disabled={loading} endIcon={<SendIcon />}>
          {loading ? <CircularProgress size={24} color="inherit" /> : "Yuborish"}
        </Button>
      </Box>
    </Box>
  );
};

export default CreatePostForm;
