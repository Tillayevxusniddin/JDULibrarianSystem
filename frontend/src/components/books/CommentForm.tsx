import React, { useState } from 'react';
import { Box, TextField, Button, Rating, Typography } from '@mui/material';
import { useAuthStore } from '../../store/auth.store';
import api from '../../api';
import type { Comment } from '../../types';
import toast from 'react-hot-toast'; // <-- IMPORT QILINDI

interface CommentFormProps {
  bookId: string;
  onCommentPosted: (newComment: Comment) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ bookId, onCommentPosted }) => {
  const { user } = useAuthStore();
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment) {
      toast.error('Iltimos, izoh matnini kiriting.'); // <-- O'ZGARTIRILDI
      return;
    }
    try {
      const response = await api.post<Comment>(`/books/${bookId}/comments`, {
        comment,
        rating,
      });
      toast.success('Fikringiz uchun rahmat!'); // <-- QO'SHILDI
      onCommentPosted(response.data);
      setComment('');
      setRating(0);
    } catch (err) {
      toast.error('Izoh yuborishda xatolik yuz berdi.'); // <-- O'ZGARTIRILDI
    }
  };

  if (!user) {
    return <Typography>Izoh qoldirish uchun tizimga kiring.</Typography>;
  }

  return (
    <Box component="form" onSubmit={handleSubmit} className="mt-6">
      <Typography variant="h6" gutterBottom>O'z fikringizni bildiring</Typography>
      <Rating
        name="simple-controlled"
        value={rating}
        onChange={(_, newValue) => {
          setRating(newValue);
        }}
        className="mb-2"
      />
      <TextField
        fullWidth
        multiline
        rows={3}
        label="Izohingiz"
        variant="outlined"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button type="submit" variant="contained" className="mt-2">
        Yuborish
      </Button>
    </Box>
  );
};

export default CommentForm;
