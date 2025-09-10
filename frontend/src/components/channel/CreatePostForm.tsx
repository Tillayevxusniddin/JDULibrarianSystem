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
    <Box sx={{
      background: 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
      backdropFilter: 'blur(10px)',
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      p: 3,
    }}>
      {imagePreview && (
        <Box sx={{ position: 'relative', width: 150, mb: 2 }}>
          <Box 
            component="img" 
            src={imagePreview} 
            alt="Preview" 
            sx={{ 
              width: '100%', 
              borderRadius: 2,
              boxShadow: (theme) => theme.shadows[4],
            }} 
          />
          <IconButton 
            onClick={removeImage} 
            size="small" 
            sx={{ 
              position: 'absolute', 
              top: -8, 
              right: -8, 
              bgcolor: 'error.main',
              color: 'white',
              '&:hover': { 
                bgcolor: 'error.dark',
                transform: 'rotate(90deg)',
              },
              transition: 'all 0.2s ease',
              boxShadow: (theme) => theme.shadows[2],
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        <Avatar 
          src={avatarUrl}
          sx={{
            width: 48,
            height: 48,
            border: '2px solid',
            borderColor: 'primary.main',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            }
          }}
        >
          {user?.firstName.charAt(0)}
        </Avatar>
        <TextField
          fullWidth
          multiline
          maxRows={5}
          variant="outlined"
          placeholder="Nima haqida o'ylayapsiz?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': { 
              borderRadius: 3,
              bgcolor: 'background.default',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: (theme) => theme.shadows[2],
              },
              '&.Mui-focused': {
                boxShadow: (theme) => theme.shadows[4],
                transform: 'translateY(-1px)',
              }
            }
          }}
        />
        <IconButton 
          color="primary" 
          component="label" 
          disabled={loading}
          sx={{
            bgcolor: 'primary.light',
            '&:hover': {
              bgcolor: 'primary.main',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <PhotoCameraIcon />
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
        </IconButton>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={loading || (!content.trim() && !postImage)} 
          endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            background: 'linear-gradient(45deg, #3B82F6, #8B5CF6)',
            '&:hover': {
              background: 'linear-gradient(45deg, #2563EB, #7C3AED)',
              transform: 'translateY(-1px)',
              boxShadow: (theme) => theme.shadows[4],
            },
            '&:disabled': {
              background: 'grey.300',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {loading ? "Yuborilmoqda..." : "Yuborish"}
        </Button>
      </Box>
    </Box>
  );
};

export default CreatePostForm;
