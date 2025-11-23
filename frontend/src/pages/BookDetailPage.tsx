import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Divider,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from "@mui/material";
import { responsiveTableSx } from "../components/common/tableResponsive";
import api from "../api";
import type { Book, BookComment, BookCopy, BookCopyStatus } from "../types";
import CommentList from "../components/books/CommentList";
import CommentForm from "../components/books/CommentForm";
import BookActions from "../components/books/BookActions";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/auth.store";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";

import defaultBookCover from '../assets/default-book-cover.png';

// Animatsiya uchun variantlar
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Nusxa statusi uchun ranglar
const getCopyStatusChipColor = (status: BookCopyStatus) => {
  switch (status) {
    case "AVAILABLE":
      return "success";
    case "BORROWED":
      return "error";
    case "MAINTENANCE":
      return "warning";
    case "LOST":
      return "default";
    default:
      return "default";
  }
};

const BookDetailPage: React.FC = () => {
  const { id: bookId } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [book, setBook] = useState<Book | null>(null);
  const [comments, setComments] = useState<BookComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Nusxalarni boshqarish uchun state'lar
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
  const [isAddCopyModalOpen, setAddCopyModalOpen] = useState(false);
  const [newBarcode, setNewBarcode] = useState("");
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const openMenu = Boolean(anchorEl);

  const fetchBookDetails = useCallback(async () => {
    if (!bookId) return;
    try {
      const [bookResponse, commentsResponse] = await Promise.all([
        api.get<Book>(`/books/${bookId}`),
        api.get<BookComment[]>(`/books/${bookId}/comments`),
      ]);
      setBook(bookResponse.data);
      setComments(commentsResponse.data);
    } catch (err) {
      const errorMessage = "Ma'lumotlarni yuklashda xatolik yuz berdi.";
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

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    copy: BookCopy
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedCopy(copy);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCopy(null);
  };

  const handleUpdateCopyStatus = async (newStatus: BookCopyStatus) => {
    if (!selectedCopy) return;
    handleMenuClose();
    try {
      await api.put(`/books/copies/${selectedCopy.id}`, { status: newStatus });
      toast.success(`Nusxa holati "${newStatus}" ga o'zgartirildi.`);
      fetchBookDetails();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Holatni o'zgartirishda xatolik."
      );
    }
  };

  const handleDeleteClick = () => {
    if (!selectedCopy) return;
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleConfirmDeleteCopy = async () => {
    if (!selectedCopy) return;
    try {
      await api.delete(`/books/copies/${selectedCopy.id}`);
      toast.success(`Nusxa (shtrix-kod: ${selectedCopy.barcode}) o'chirildi.`);
      fetchBookDetails();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Nusxani o'chirishda xatolik."
      );
    } finally {
      setDeleteConfirmOpen(false);
      setSelectedCopy(null);
    }
  };

  const handleAddNewCopy = async () => {
    if (!newBarcode.trim()) {
      return toast.error("Iltimos, shtrix-kodni kiriting.");
    }
    try {
      await api.post(`/books/${bookId}/copies`, { barcode: newBarcode.trim() });
      toast.success("Yangi nusxa muvaffaqiyatli qo'shildi!");
      setNewBarcode("");
      setAddCopyModalOpen(false);
      fetchBookDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Nusxa qo'shishda xatolik.");
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  if (error || !book)
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error || "Kitob topilmadi."}
      </Alert>
    );

  const imageUrl = book.coverImage || defaultBookCover;

  return (
    <Box>
      {/* Enhanced blurred background with better dark mode support */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "450px",
          zIndex: -1,
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(40px)",
            transform: "scale(1.2)",
            opacity: 0.6,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: (theme) =>
              theme.palette.mode === "dark"
                ? `linear-gradient(to bottom, 
                  ${theme.palette.background.default} 0%, 
                  rgba(15, 23, 42, 0.7) 30%, 
                  rgba(15, 23, 42, 0.85) 60%,
                  ${theme.palette.background.default} 100%)`
                : `linear-gradient(to bottom, 
                  ${theme.palette.background.default} 0%, 
                  rgba(244, 246, 248, 0.7) 30%, 
                  rgba(244, 246, 248, 0.9) 60%,
                  ${theme.palette.background.default} 100%)`,
          },
        }}
      />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 gap-4 px-2 mt-10 md:grid-cols-12 md:gap-6 md:mt-16">
          <div className="md:col-span-4">
            <motion.div variants={itemVariants}>
              <Paper
                elevation={10}
                sx={{
                  overflow: "hidden",
                  aspectRatio: "2 / 3",
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(96, 165, 250, 0.2)"
                      : "0 20px 60px rgba(0, 0, 0, 0.3)",
                  border: (theme) =>
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(148, 163, 184, 0.2)"
                      : "none",
                }}
              >
                <img
                  src={imageUrl}
                  alt={book.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Paper>
            </motion.div>
          </div>
          <div className="md:col-span-8">
            <motion.div variants={itemVariants}>
              <Chip
                label={book.category.name}
                color="secondary"
                sx={{
                  mb: 1,
                  fontWeight: "bold",
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 4px 12px rgba(244, 114, 182, 0.3)"
                      : undefined,
                }}
              />
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  textShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 2px 10px rgba(0, 0, 0, 0.5)"
                      : "none",
                }}
              >
                {book.title}
              </Typography>
              <Typography
                variant="h5"
                component="h2"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                {book.author || "Noma'lum muallif"}
              </Typography>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(244, 114, 182, 0.1) 100%)"
                      : "rgba(96, 165, 250, 0.08)",
                  backdropFilter: "blur(10px)",
                  border: (theme) =>
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(148, 163, 184, 0.2)"
                      : "1px solid rgba(96, 165, 250, 0.2)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-around",
                    textAlign: "center",
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {book.availableCopies}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mavjud nusxalar
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {book.totalCopies}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Umumiy nusxalar
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                {book.description || "Bu kitob uchun tavsif mavjud emas."}
              </Typography>
            </motion.div>
            <motion.div variants={itemVariants}>
              <BookActions book={book} onActionSuccess={fetchBookDetails} />
            </motion.div>
          </div>
        </div>

        {user?.role === "LIBRARIAN" && (
          <motion.div variants={itemVariants}>
            <Paper
              sx={{
                mt: 6,
                p: { xs: 2, md: 3 },
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(30, 41, 59, 0.95) 100%)"
                    : undefined,
                backdropFilter: "blur(10px)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  Kitob Nusxalari
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setAddCopyModalOpen(true)}
                  sx={{
                    borderWidth: 2,
                    "&:hover": {
                      borderWidth: 2,
                      background: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(96, 165, 250, 0.1)"
                          : undefined,
                    },
                  }}
                >
                  Yangi nusxa qo'shish
                </Button>
              </Box>
              <TableContainer>
                <Table size="small" sx={responsiveTableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Shtrix-kod (Barcode)
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Holati</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Harakatlar
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {book.copies.map((copy) => (
                      <TableRow key={copy.id} hover>
                        <TableCell data-label="Shtrix-kod (Barcode)">
                          {copy.barcode}
                        </TableCell>
                        <TableCell data-label="Holati">
                          <Chip
                            label={copy.status}
                            color={getCopyStatusChipColor(copy.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell data-label="Harakatlar" align="right">
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

        <motion.div variants={itemVariants}>
          <Paper
            sx={{
              mt: 4,
              p: { xs: 2, md: 4 },
              mx: 2,
              mb: 2,
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(30, 41, 59, 0.95) 100%)"
                  : undefined,
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
              Fikr-mulohazalar
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <CommentForm
              bookId={book.id}
              onCommentPosted={handleCommentPosted}
            />
            <Box sx={{ mt: 4 }}>
              <CommentList comments={comments} />
            </Box>
          </Paper>
        </motion.div>
      </motion.div>

      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem disabled>Statusni o'zgartirish:</MenuItem>
        <MenuItem
          onClick={() => handleUpdateCopyStatus("AVAILABLE")}
          disabled={selectedCopy?.status === "BORROWED"}
        >
          Mavjud
        </MenuItem>
        <MenuItem
          onClick={() => handleUpdateCopyStatus("MAINTENANCE")}
          disabled={selectedCopy?.status === "BORROWED"}
        >
          Ta'mirda
        </MenuItem>
        <MenuItem onClick={() => handleUpdateCopyStatus("LOST")}>
          Yo'qolgan
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleDeleteClick}
          sx={{ color: "error.main" }}
          disabled={selectedCopy?.status !== "AVAILABLE"}
        >
          O'chirish
        </MenuItem>
      </Menu>

      <Dialog
        open={isAddCopyModalOpen}
        onClose={() => setAddCopyModalOpen(false)}
      >
        <DialogTitle>Yangi Nusxa Qo'shish</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Kitob: <strong>{book.title}</strong>
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Yangi nusxaning shtrix-kodi"
            type="text"
            fullWidth
            variant="standard"
            value={newBarcode}
            onChange={(e) => setNewBarcode(e.target.value)}
            sx={{
              "& .MuiInput-underline:after": {
                borderBottomColor: "primary.main",
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCopyModalOpen(false)}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleAddNewCopy}
            variant="contained"
            sx={{
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)"
                  : undefined,
            }}
          >
            Qo'shish
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Haqiqatan ham <strong>"{selectedCopy?.barcode}"</strong>{" "}
            shtrix-kodli nusxani o'chirmoqchimisiz?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Yo'q</Button>
          <Button onClick={handleConfirmDeleteCopy} color="error">
            Ha, o'chirish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookDetailPage;
