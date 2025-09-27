import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, CircularProgress, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User, UserRole, UserStatus } from '../../types';
import api from '../../api';
import toast from 'react-hot-toast';

// Frontend uchun validatsiya sxemasi (parolsiz)
const userSchema = z.object({
  firstName: z.string().min(2, 'Ism kamida 2 belgidan iborat bo`lishi kerak'),
  lastName: z.string().min(2, 'Familiya kamida 2 belgidan iborat bo`lishi kerak'),
  email: z.string().email('Yaroqli email manzil kiriting'),
  // Tahrirlash uchun rol va status maydonlari
  role: z.custom<UserRole>(), // nativeEnum o'rniga z.custom ishlatamiz
  status: z.custom<UserStatus>(),
});

type UserInput = z.infer<typeof userSchema>;

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null; // Tahrirlash uchun
}

const UserFormModal: React.FC<UserFormModalProps> = ({ open, onClose, onSuccess, user }) => {
  const isEditMode = !!user;
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'USER',
      status: 'ACTIVE',
    }
  });

  // Modal ochilganda yoki user o'zgarganda formani to'ldiramiz/tozalaymiz
  useEffect(() => {
    if (open) {
      if (isEditMode && user) {
        reset({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
        });
      } else {
        reset({
          firstName: '',
          lastName: '',
          email: '',
          role: 'USER',
          status: 'ACTIVE',
        });
      }
    }
  }, [open, user, isEditMode, reset]);

  const onSubmit = async (data: UserInput) => {
    setSubmitting(true);
    try {
      if (isEditMode) {
        // Tahrirlash rejimida parolni yubormaymiz
        const { email, ...updateData } = data; // email'ni ham o'zgartirishga ruxsat yo'q
        await api.put(`/users/${user!.id}`, updateData);
        toast.success('Foydalanuvchi ma\'lumotlari muvaffaqiyatli yangilandi.');
      } else {
        // Yaratish rejimida backend o'zi parol yaratadi
        await api.post('/users', data);
        toast.success('Foydalanuvchi muvaffaqiyatli yaratildi! Parol uning emailiga jo\'natildi.');
      }
      onSuccess(); // Jadvalni yangilash uchun
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {isEditMode ? "Foydalanuvchini Tahrirlash" : "Yangi Foydalanuvchi Yaratish"}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Controller name="firstName" control={control} render={({ field }) => <TextField {...field} autoFocus label="Ism" error={!!errors.firstName} helperText={errors.firstName?.message} />} />
            <Controller name="lastName" control={control} render={({ field }) => <TextField {...field} label="Familiya" error={!!errors.lastName} helperText={errors.lastName?.message} />} />
            <Controller name="email" control={control} render={({ field }) => <TextField {...field} label="Email Manzil" type="email" error={!!errors.email} helperText={errors.email?.message} disabled={isEditMode} />} />

            {!isEditMode && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Foydalanuvchi uchun tasodifiy parol yaratiladi va uning email manziliga jo'natiladi.
              </Typography>
            )}

            {isEditMode && (
              <>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Rol</InputLabel>
                      <Select {...field} label="Rol">
                        <MenuItem value="USER">USER</MenuItem>
                        <MenuItem value="LIBRARIAN">LIBRARIAN</MenuItem>
                        <MenuItem value="MANAGER">MANAGER</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Holat</InputLabel>
                      <Select {...field} label="Holat">
                        <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                        <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                        <MenuItem value="SUSPENDED">SUSPENDED</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </>
            )}

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose}>Bekor qilish</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : (isEditMode ? "Saqlash" : "Yaratish")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserFormModal;