// frontend/src/components/books/BookCard.tsx

import React from 'react';
import { Card, Typography, Chip, Box, CardActions, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import type { Book } from '../../types';
import { Link } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
// --- 1-QADAM: useAuthStore'ni import qilamiz ---
import { useAuthStore } from '../../store/auth.store';

import defaultBookCover from '../../assets/default-book-cover.png';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}
const getStatusChip = (availableCopies: number) => {
  if (availableCopies > 0) {
    return { label: 'MAVJUD', color: 'success' as const };
  }
  return { label: 'BAND', color: 'error' as const };
};

const BookCard: React.FC<BookCardProps> = ({ book, onEdit, onDelete }) => {
  // --- 2-QADAM: Foydalanuvchi ma'lumotini store'dan olamiz ---
  const { user } = useAuthStore();
  
  const imageUrl = book.coverImage || defaultBookCover;


  const { label, color } = getStatusChip(book.availableCopies);

  return (
    <motion.div
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="h-full"
    >
      <Card sx={{
        position: 'relative',
        height: '100%',
        borderRadius: (t) => t.customShape.radius.sm,
        overflow: 'hidden',
        boxShadow: 'none',
      }}>
        {/* Orqa fon rasmi va uning ustidagi qoplama */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'transform 0.5s ease-in-out',
        }}
        />
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.5) 100%)',
        }}
        />
        
        <Link to={`/books/${book.id}`} style={{ textDecoration: 'none' }}>
          <Box sx={{
            position: 'relative',
            color: 'white',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            height: '400px',
          }}>
            <Chip
              label={label}
              size="small"
              color={color}
              sx={{ position: 'absolute', top: 16, right: 16, fontWeight: 'bold' }}
            />

            
            {/* --- 3-QADAM: SHARTLI RENDER QILISH --- */}
            {/* Bu blok faqat foydalanuvchi roli 'LIBRARIAN' bo'lsa ko'rinadi */}
            {user?.role === 'LIBRARIAN' && (
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold', 
                  bgcolor: 'rgba(0,0,0,0.5)', 
                  px: 1.5, 
                  py: 0.5,
                  borderRadius: (t) => t.customShape.radius.sm, 
                  display: 'inline-block',
                  alignSelf: 'flex-start',
                  mb: 1
                }}
              >
                Mavjud: {book.availableCopies} / {book.totalCopies}
              </Typography>
            )}

            <motion.div
                variants={{
                    rest: { y: 20, opacity: 0 },
                    hover: { y: 0, opacity: 1 }
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
            >
                <Typography variant="body2" sx={{ mb: 1 }}>{book.category.name}</Typography>
            </motion.div>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, lineHeight: 1.2 }}>
              {book.title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {book.author || 'Noma\'lum muallif'}
            </Typography>
          </Box>
        </Link>
        
        {user?.role === 'LIBRARIAN' && (
          <motion.div
            style={{ position: 'absolute', top: 8, left: 8 }}
            variants={{
              rest: { opacity: 0, scale: 0.8 },
              hover: { opacity: 1, scale: 1 }
            }}
            transition={{ duration: 0.3 }}
          >
            <CardActions sx={{ p: 0, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: (t) => t.customShape.radius.sm }}>
              <IconButton onClick={() => onEdit(book)} sx={{ color: 'white' }}><EditIcon /></IconButton>
              <IconButton onClick={() => onDelete(book)} sx={{ color: '#ffcdd2' }}><DeleteIcon /></IconButton>
            </CardActions>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};

export default BookCard;
