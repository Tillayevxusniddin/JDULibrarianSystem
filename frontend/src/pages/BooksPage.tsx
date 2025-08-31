import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Alert, Pagination, Box, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd'; 
import api from '../api';
import type { Book, PaginatedResponse } from '../types';
import BookCard from '../components/books/BookCard';
import BookFilter from '../components/books/BookFilter';
import BookFormModal from '../components/books/BookFormModal';
import BulkBookUploadModal from '../components/books/BulkBookUploadModal';
import BookCardSkeleton from '../components/books/BookCardSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ search: '', categoryId: '', availability: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const [isBulkModalOpen, setBulkModalOpen] = useState(false); 

  const { user } = useAuthStore();

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<PaginatedResponse<Book>>('/books', {
        params: { 
            page, 
            limit: 12, 
            search: filters.search || undefined, 
            categoryId: filters.categoryId || undefined,
            availability: filters.availability || undefined
        },
      });
      setBooks(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (err) {
      const errorMessage = 'Kitoblarni yuklashda xatolik yuz berdi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, filters.search, filters.categoryId, filters.availability]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleFilterChange = useCallback((newFilters: { search: string; categoryId: string; availability: string }) => {
    setPage(1);
    setFilters(newFilters);
  }, []);

  const handleOpenModal = (book: Book | null = null) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setBulkModalOpen(false); // Ikkala modal uchun ham yopish
    fetchBooks();
  };

  const handleDeleteClick = (book: Book) => {
    setBookToDelete(book);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;
    try {
      await api.delete(`/books/${bookToDelete.id}`);
      toast.success(`"${bookToDelete.title}" kitobi muvaffaqiyatli o'chirildi.`);
      setDeleteConfirmOpen(false);
      fetchBooks();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Kitobni o'chirishda noma'lum xatolik yuz berdi.";
      toast.error(errorMessage);
      setDeleteConfirmOpen(false);
    }
  };

  if (error && books.length === 0) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Kutubxona Katalogi
        </Typography>
        {user?.role === 'LIBRARIAN' && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<LibraryAddIcon />} onClick={() => setBulkModalOpen(true)}>
              Ommaviy Qo'shish
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
              Yangi Kitob
            </Button>
          </Box>
        )}
      </Box>

      <BookFilter onFilterChange={handleFilterChange} />

      <AnimatePresence mode="wait">
        <motion.div
          key={page + filters.search + filters.categoryId}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={{
            visible: { transition: { staggerChildren: 0.07 } },
            hidden: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
          }}
        >
          {loading ? (
            Array.from({ length: 12 }).map((_, index) => (
              <BookCardSkeleton key={index} />
            ))
          ) : books.length > 0 ? (
            books.map((book) => (
              <motion.div
                key={book.id}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ type: 'spring', stiffness: 100 }}
              >
                <BookCard
                  book={book}
                  onEdit={handleOpenModal}
                  onDelete={handleDeleteClick}
                />
              </motion.div>
            ))
          ) : (
            <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">
                Filtrlarga mos kitoblar topilmadi.
              </Typography>
            </Box>
          )}
        </motion.div>
      </AnimatePresence>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {user?.role === 'LIBRARIAN' && (
        <>
          <BookFormModal
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleSuccess}
            book={selectedBook}
          />
          <BulkBookUploadModal
            open={isBulkModalOpen}
            onClose={() => setBulkModalOpen(false)}
            onSuccess={handleSuccess}
          />
        </>
      )}

      <Dialog open={isDeleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Haqiqatan ham <strong>"{bookToDelete?.title}"</strong> kitobini o'chirmoqchimisiz?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleConfirmDelete} color="error">O'chirish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BooksPage;
