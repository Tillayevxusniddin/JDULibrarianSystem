// src/components/dashboard/StatCard.tsx

import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // <-- 1. Link'ni import qilamiz

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
  to?: string; // <-- 2. "to" degan ixtiyoriy prop qo'shamiz
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, to }) => {
  const CardContent = (
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
          height: '100%' // Kartalarning balandligini bir xil qilish uchun
        }}
      >
        <Box sx={{ position: 'absolute', right: -20, top: -10, opacity: 0.1, fontSize: '100px' }}>
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
        <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: '50%', fontSize: 32 }}>
          {icon}
        </Box>
      </Paper>
    </motion.div>
  );

  // --- 3. Agar "to" prop'i berilgan bo'lsa, kartani Link bilan o'raymiz ---
  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none' }}>
        {CardContent}
      </Link>
    );
  }

  return CardContent;
};

export default StatCard;