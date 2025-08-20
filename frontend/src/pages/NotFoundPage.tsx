// src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const NotFoundPage: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        p: 3,
        bgcolor: 'background.default'
      }}
    >
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '6rem', sm: '10rem' },
            fontWeight: 'bold',
            color: 'primary.main',
            textShadow: '4px 4px 8px rgba(0,0,0,0.1)'
          }}
        >
          404
        </Typography>
      </motion.div>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, delay: 0.4 }}
      >
        <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
          Sahifa Topilmadi
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: '400px' }}>
          Kechirasiz, siz qidirayotgan sahifa mavjud emas yoki boshqa manzilga ko'chirilgan bo'lishi mumkin.
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          sx={{ mt: 4 }}
        >
          Bosh Sahifaga Qaytish
        </Button>
      </motion.div>
    </Box>
  );
};

export default NotFoundPage;
