import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from "@mui/material";

interface ExtendLoanDialogProps {
  open: boolean;
  currentDueDate: string;
  onConfirm: (newDueDate: string) => void;
  onCancel: () => void;
  bookTitle?: string;
}

const ExtendLoanDialog: React.FC<ExtendLoanDialogProps> = ({
  open,
  currentDueDate,
  onConfirm,
  onCancel,
  bookTitle,
}) => {
  const [newDueDate, setNewDueDate] = useState("");
  const [error, setError] = useState("");

  // Set minimum date to tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  useEffect(() => {
    if (open) {
      // Default to 14 days from current due date
      const defaultDate = new Date(currentDueDate);
      defaultDate.setDate(defaultDate.getDate() + 14);
      setNewDueDate(defaultDate.toISOString().split("T")[0]);
      setError("");
    }
  }, [open, currentDueDate]);

  const handleConfirm = () => {
    if (!newDueDate) {
      setError("Yangi muddatni tanlang");
      return;
    }

    const selectedDate = new Date(newDueDate);
    const currentDate = new Date(currentDueDate);

    if (selectedDate <= currentDate) {
      setError("Yangi muddat joriy muddatdan kechroq bo'lishi kerak");
      return;
    }

    onConfirm(newDueDate);
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 2, pt: 3 }}>
        Ijara muddatini uzaytirish
      </DialogTitle>
      <DialogContent sx={{ pb: 2 }}>
        {bookTitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Kitob: <strong>{bookTitle}</strong>
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Joriy muddat: <strong>{new Date(currentDueDate).toLocaleDateString()}</strong>
        </Typography>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            type="date"
            label="Yangi qaytarish muddati"
            value={newDueDate}
            onChange={(e) => {
              setNewDueDate(e.target.value);
              setError("");
            }}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              min: minDateStr,
            }}
            error={!!error}
            helperText={error}
            sx={{ mb: 1 }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
        <Button
          onClick={onCancel}
          color="error"
          variant="outlined"
          sx={{ px: 3 }}
        >
          Bekor qilish
        </Button>
        <Button
          onClick={handleConfirm}
          color="success"
          variant="contained"
          sx={{ px: 3 }}
        >
          Tasdiqlash
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExtendLoanDialog;
