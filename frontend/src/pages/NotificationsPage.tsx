import React, { useState, useMemo } from 'react';
import { Box, Typography, CircularProgress, Button, Paper, IconButton, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import type { Notification, NotificationType } from '../types';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useNotificationStore } from '../store/notification.store';
import { motion, AnimatePresence } from 'framer-motion';

const getNotificationIcon = (type: NotificationType) => {
  const sx = { fontSize: 32 };
  switch (type) {
    case 'INFO': return <InfoIcon color="info" sx={sx} />;
    case 'WARNING': return <WarningIcon color="warning" sx={sx} />;
    case 'FINE': return <AttachMoneyIcon color="error" sx={sx} />;
    case 'RESERVATION_AVAILABLE': return <CheckCircleIcon color="success" sx={sx} />;
    default: return <InfoIcon sx={sx} />;
  }
};

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
    const { markOneAsRead, deleteNotification } = useNotificationStore();
    return (
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }}>
            <Paper
                elevation={0} variant="outlined"
                sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, mb: 2, borderRadius: 3,
                    ...(!notification.isRead && { bgcolor: 'primary.light', borderColor: 'primary.main' }),
                }}
            >
                <Box>{getNotificationIcon(notification.type)}</Box>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography>{notification.message}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(notification.createdAt).toLocaleString()}</Typography>
                </Box>
                {!notification.isRead && (
                    <IconButton onClick={() => markOneAsRead(notification.id)} title="O'qilgan deb belgilash"><MarkEmailReadIcon /></IconButton>
                )}
                <IconButton onClick={() => deleteNotification(notification.id)} title="O'chirish" color="error" size="small"><DeleteIcon /></IconButton>
            </Paper>
        </motion.div>
    );
};

const NotificationsPage: React.FC = () => {
  const { notifications, loading, unreadCount, markAllAsRead, deleteRead } = useNotificationStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.isRead);
    return notifications;
  }, [notifications, filter]);

  const hasReadNotifications = useMemo(() => notifications.some(n => n.isRead), [notifications]);

  if (loading) return <CircularProgress />;

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Bildirishnomalar</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
            {/* --- O'ZGARISH SHU YERDA --- */}
            <Button 
              variant="contained" 
              onClick={markAllAsRead}
              disabled={unreadCount === 0} // Tugmani yo'q qilish o'rniga nofaol qilamiz
            >
                Barchasini o'qish ({unreadCount})
            </Button>
            {/* --- O'ZGARISH TUGADI --- */}
            {hasReadNotifications && <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={() => setConfirmOpen(true)}>O'qilganlarni tozalash</Button>}
        </Box>
      </Box>
      
      <Paper sx={{ borderRadius: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={filter} onChange={(_, newValue) => setFilter(newValue)} variant="fullWidth">
            <Tab label="Barchasi" value="all" />
            <Tab label={`O'qilmaganlar (${unreadCount})`} value="unread" />
          </Tabs>
        </Box>
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            {filteredNotifications.length > 0 ? (
            <AnimatePresence>
                {filteredNotifications.map((notif) => (
                <NotificationItem key={notif.id} notification={notif} />
                ))}
            </AnimatePresence>
            ) : (
            <Typography sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                {filter === 'unread' ? "O'qilmagan bildirishnomalar mavjud emas." : "Bildirishnomalar mavjud emas."}
            </Typography>
            )}
        </Box>
      </Paper>

      <Dialog open={isConfirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Tozalashni tasdiqlang</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Haqiqatan ham barcha o'qilgan bildirishnomalarni o'chirmoqchimisiz? Bu amalni orqaga qaytarib bo'lmaydi.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Bekor qilish</Button>
          <Button onClick={() => { deleteRead(); setConfirmOpen(false); }} color="error">Ha, o'chirish</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationsPage;
