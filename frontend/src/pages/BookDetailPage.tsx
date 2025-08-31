// src/pages/BookDetailPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, CircularProgress, Alert, Paper, Chip, Divider, Box, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Menu, MenuItem } from '@mui/material';
import api from '../api';
import type { Book, BookComment, BookCopy, BookCopyStatus } from '../types';
import CommentList from '../components/books/CommentList';
import CommentForm from '../components/books/CommentForm';
import BookActions from '../components/books/BookActions';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/auth.store';
import MoreVertIcon from '@mui/icons-material/MoreVert';
// import AddIcon from '@mui/icons-material/Add';

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

const getCopyStatusChipColor = (status: BookCopyStatus) => {
  switch (status) {
    case 'AVAILABLE': return 'success';
    case 'BORROWED': return 'error';
    case 'MAINTENANCE': return 'warning';
    case 'LOST': return 'default';
    default: return 'default';
  }
};


const BookDetailPage: React.FC = () => {
  const { id: bookId } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [book, setBook] = useState<Book | null>(null);
  const [comments, setComments] = useState<BookComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NUSXALARNI BOSHQARISH UCHUN YANGI STATE'LAR ---
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
  const openMenu = Boolean(anchorEl);

  const fetchBookDetails = useCallback(async () => {
    if (!bookId) return;
    try {
      // setLoading(true) ni olib tashlaymiz, chunki sahifa yangilanganda kerak emas
      const [bookResponse, commentsResponse] = await Promise.all([
        api.get<Book>(`/books/${bookId}`),
        api.get<BookComment[]>(`/books/${bookId}/comments`),
      ]);
      setBook(bookResponse.data);
      setComments(commentsResponse.data);
    } catch (err) {
      const errorMessage = 'Ma\'lumotlarni yuklashda xatolik yuz berdi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [bookId]);


  useEffect(() => {
    setLoading(true);
    fetchBookDetails();
  }, [fetchBookDetails]);


  const handleCommentPosted = (newComment: BookComment) => {
    setComments([newComment, ...comments]);
  };


  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, copy: BookCopy) => {
    setAnchorEl(event.currentTarget);
    setSelectedCopy(copy);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCopy(null);
  };

  const handleUpdateCopyStatus = async (newStatus: BookCopyStatus) => {
    if (!selectedCopy) return;
    try {
      await api.put(`/books/copies/${selectedCopy.id}`, { status: newStatus });
      toast.success(`Nusxa holati "${newStatus}" ga o'zgartirildi.`);
      fetchBookDetails(); // Ma'lumotlarni yangilaymiz
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Holatni o'zgartirishda xatolik.");
    } finally {
      handleMenuClose();
    }
  };


  const handleDeleteCopy = async () => {
    if (!selectedCopy) return;
     try {
      await api.delete(`/books/copies/${selectedCopy.id}`);
      toast.success(`Nusxa (shtrix-kod: ${selectedCopy.barcode}) o'chirildi.`);
      fetchBookDetails(); // Ma'lumotlarni yangilaymiz
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Nusxani o'chirishda xatolik.");
    } finally {
      handleMenuClose();
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  if (error || !book) {
    return <Alert severity="error" sx={{ m: 2 }}>{error || 'Kitob topilmadi.'}</Alert>;
  }
  
  const imageUrl = book.coverImage ? `http://localhost:5000${book.coverImage}` : `https://via.placeholder.com/400x600?text=${book.title}`;

  // const placeholderImage = `https://via.placeholder.com/400x600.png/EBF4FF/7F9CF5?text=${book.title.replace(/\s/g, '+')}`;

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
              <Chip
                label={book.category.name}
                color="secondary"
                sx={{ mb: 1, fontWeight: 'bold' }}
              />
              <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
                {book.title}
              </Typography>
              <Typography variant="h5" component="h2" color="text.secondary" sx={{ mb: 3 }}>
                {book.author || 'Noma\'lum muallif'} {/* <-- Muallif ixtiyoriy bo'lgani uchun o'zgartirildi */}
              </Typography>
            </motion.div>

            {/* --- NUSXALAR SONINI KO'RSATADIGAN YANGI BLOK --- */}
            <motion.div variants={itemVariants}>
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(255, 255, 255, 0.08)', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{book.availableCopies}</Typography>
                    <Typography variant="body2" color="text.secondary">Mavjud nusxalar</Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{book.totalCopies}</Typography>
                    <Typography variant="body2" color="text.secondary">Umumiy nusxalar</Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
            {/* --- YANGI BLOK TUGADI --- */}

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

        {user?.role === 'LIBRARIAN' && (
          <motion.div variants={itemVariants}>
            <Paper sx={{ mt: 6, p: { xs: 2, md: 3 }, borderRadius: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Kitob Nusxalari
                  </Typography>
                  {/* <Button variant="outlined" startIcon={<AddIcon />}>Yangi nusxa qo'shish</Button> */}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Shtrix-kod (Barcode)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Holati</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Harakatlar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {book.copies.map((copy) => (
                      <TableRow key={copy.id} hover>
                        <TableCell>{copy.barcode}</TableCell>
                        <TableCell>
                          <Chip 
                            label={copy.status} 
                            color={getCopyStatusChipColor(copy.status)} 
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={(e) => handleMenuClick(e, copy)}>
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </motion.div>
        )}

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
       {/* Nusxani boshqarish uchun menyu */}
      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem disabled>Statusni o'zgartirish:</MenuItem>
        
        {/* BU YERDA SIZNING TAKLIFINGIZ AMALGA OSHIRILDI */}
        <MenuItem 
          onClick={() => handleUpdateCopyStatus('AVAILABLE')} 
          disabled={selectedCopy?.status === 'BORROWED'}>
            Mavjud
        </MenuItem>
        <MenuItem 
          onClick={() => handleUpdateCopyStatus('MAINTENANCE')} 
          disabled={selectedCopy?.status === 'BORROWED'}>
            Ta'mirda
        </MenuItem>
        <MenuItem 
          onClick={() => handleUpdateCopyStatus('LOST')}>
            Yo'qolgan
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={handleDeleteCopy} 
          sx={{ color: 'error.main' }} 
          disabled={selectedCopy?.status === 'BORROWED'}>
            O'chirish
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default BookDetailPage;