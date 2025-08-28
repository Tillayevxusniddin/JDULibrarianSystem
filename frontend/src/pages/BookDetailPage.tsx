// src/pages/BookDetailPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, CircularProgress, Alert, Paper, Chip, Divider, Box, IconButton, Tooltip } from '@mui/material';
import api from '../api';
import type { Book, Comment } from '../types';
import CommentList from '../components/books/CommentList';
import CommentForm from '../components/books/CommentForm';
import BookActions from '../components/books/BookActions';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/auth.store';

// Animatsiya uchun variantlar
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchBookDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [bookResponse, commentsResponse] = await Promise.all([
        api.get<Book>(`/books/${id}`),
        api.get<Comment[]>(`/books/${id}/comments`),
      ]);
      setBook(bookResponse.data);
      setComments(commentsResponse.data);
    } catch (err) {
      const errorMessage = 'Ma`lumotlarni yuklashda xatolik yuz berdi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const handleCommentPosted = (newComment: Comment) => {
    setComments([newComment, ...comments]);
  };

  // Increment/decrement controls removed per request; manage counts in the edit form instead.

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !book) {
    return <Alert severity="error" sx={{ m: 2 }}>{error || 'Kitob topilmadi.'}</Alert>;
  }
  
  const placeholderImage = `https://via.placeholder.com/400x600.png/EBF4FF/7F9CF5?text=${book.title.replace(/\s/g, '+')}`;
  const imageUrl = book.coverImage ? `http://localhost:5000${book.coverImage}` : placeholderImage;

  return (
    <Box sx={{ position: 'relative', overflowX: 'hidden' }}>
      {/* Orqa fon uchun xiralashtirilgan rasm */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '400px',
          zIndex: -1,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: (theme) =>
              `linear-gradient(to top, ${theme.palette.background.default} 10%, rgba(0,0,0,0.5) 100%)`,
          },
        }}
      />

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {/* --- Tailwind Grid --- */}
        <div className="grid grid-cols-1 gap-4 px-2 mt-10 md:grid-cols-12 md:gap-6 md:mt-16">
          {/* Chap taraf: Kitob muqovasi */}
          <div className="md:col-span-4">
            <motion.div variants={itemVariants}>
              <Paper
                elevation={10}
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  aspectRatio: '2 / 3',
                }}
              >
                <img
                  src={imageUrl}
                  alt={book.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Paper>
            </motion.div>
          </div>

          {/* O‘ng taraf: Kitob ma’lumotlari */}
          <div className="md:col-span-8">
            <motion.div variants={itemVariants}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <Chip label={book.category?.name ?? 'Uncategorized'} color="secondary" sx={{ fontWeight: 'bold' }} />
                {typeof book.availableCopies === 'number' && typeof book.totalCopies === 'number' && (
                  <Chip
                    label={`${book.availableCopies}/${book.totalCopies} available`}
                    size="small"
                    color={book.availableCopies > 0 ? 'success' : 'default'}
                  />
                )}
              </Box>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
                {book.title}
              </Typography>
              <Typography variant="h5" component="h2" color="text.secondary" sx={{ mb: 3 }}>
                {book.author ?? 'Unknown'}
              </Typography>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                {book.description || 'Bu kitob uchun tavsif mavjud emas.'}
              </Typography>
            </motion.div>

            <motion.div variants={itemVariants}>
              <BookActions book={book} onActionSuccess={fetchBookDetails} />
            </motion.div>
          </div>
        </div>
        {/* --- /Tailwind Grid --- */}

        {/* Izohlar qismi */}
        <motion.div variants={itemVariants}>
          <Paper sx={{ mt: 6, p: { xs: 2, md: 4 }, borderRadius: 4, mx: 2, mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              Fikr-mulohazalar
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <CommentForm bookId={book.id} onCommentPosted={handleCommentPosted} />
            <Box sx={{ mt: 4 }}>
              <CommentList comments={comments} />
            </Box>
          </Paper>
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default BookDetailPage;
