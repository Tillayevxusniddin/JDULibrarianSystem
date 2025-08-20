// src/components/dashboard/StatCard.tsx
import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Paper
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 4,
          color: 'white',
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', right: -20, top: -10, opacity: 0.1, fontSize: '100px' }}>
          {/* Ikonka o'lchamini meros qilib oladi */}
          {icon}
        </Box>
        
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{
          p: 2,
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // O'lchamni shu yerda belgilaymiz
          fontSize: 32,
        }}>
          {/* Endi cloneElement ishlatmaymiz */}
          {icon}
        </Box>
      </Paper>
    </motion.div>
  );
};

export default StatCard;
