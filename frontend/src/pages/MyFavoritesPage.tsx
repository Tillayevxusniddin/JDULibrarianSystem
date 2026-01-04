import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import api from '../api';
import type { Favorite } from '../types';
import BookCard from '../components/books/BookCard';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const MyFavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Favorite[]>('/favorites');
      setFavorites(response.data);
    } catch (err) {
      const errorMessage = 'Sevimlilarni yuklashda xatolik yuz berdi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (bookId: string) => {
    try {
      await api.delete(`/favorites/${bookId}`);
      toast.success('Sevimlilardan olib tashlandi.');
      fetchFavorites();
    } catch (error: any) {
      const message = error.response?.data?.message || "Sevimlilardan olib tashlanmadi.";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Mening Sevimlilarim
      </Typography>

      {favorites.length === 0 ? (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <Typography color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            Sizda hali sevimli kitoblar yo'q. Kitoblarni sevimlilar ro'yxatiga qo'shing!
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          <AnimatePresence mode="popLayout">
            {favorites.map((favorite) => (
              <motion.div
                key={favorite.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <BookCard
                  book={favorite.book}
                  onEdit={undefined}
                  onDelete={undefined}
                  onRemoveFavorite={() => handleRemoveFavorite(favorite.bookId)}
                  isFavorited={true}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}
    </Box>
  );
};

export default MyFavoritesPage;
