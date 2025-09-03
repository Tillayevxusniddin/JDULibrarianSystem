import React from 'react';
import { Box, Typography, Paper, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { motion } from 'framer-motion';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TelegramIcon from '@mui/icons-material/Telegram';

const premiumFeatures = [
  'Shaxsiy blog-kanal ochish imkoniyati',
  'Cheksiz postlar va rasmlar joylash',
  'O\'z auditoriyangizni yig\'ish',
  'Boshqa foydalanuvchilar bilan fikr almashish',
];

const PremiumPage: React.FC = () => {
  // Bu yerga o'zingizning Telegram manzilingizni yozing
  const managerTelegramLink = 'https://t.me/tillayevxn';

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            background: (theme) => `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.primary.light} 100%)`
          }}
        >
          <WorkspacePremiumIcon sx={{ fontSize: 60, color: 'primary.main' }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 2 }}>
            Premium Tarifga O'ting!
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
            O'z ijodiy dunyongizni kashf eting va uni boshqalar bilan baham ko'ring.
          </Typography>
        </Paper>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Paper sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Nimalarga ega bo'lasiz?
          </Typography>
          <List>
            {premiumFeatures.map((feature, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText primary={feature} />
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 4, p: 3, bgcolor: 'action.hover', borderRadius: (t) => t.customShape.radius.md, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 'bold' }}>
              Premium tarifni faollashtirish uchun menejer bilan bog'laning.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<TelegramIcon />}
              sx={{ mt: 2 }}
              href={managerTelegramLink}
              target="_blank" // Havolani yangi vkladkada ochish
            >
              Menejer bilan bog'lanish
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default PremiumPage;
