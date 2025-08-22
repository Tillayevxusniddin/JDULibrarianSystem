import React from 'react';
import { Card, Box, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';

const BookCardSkeleton: React.FC = () => {
  return (
    <motion.div className="h-full">
      <Card sx={{
        position: 'relative',
        height: '400px', // Bizning BookCard bilan bir xil balandlikda
        borderRadius: 4,
        overflow: 'hidden',
        bgcolor: 'action.hover' // Orqa fon uchun xiraroq rang
      }}>
        <Box sx={{
          position: 'relative',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          height: '100%',
        }}>
          {/* Status Chip uchun skelet */}
          <Skeleton 
            variant="rounded" 
            width={80} 
            height={24} 
            sx={{ position: 'absolute', top: 16, right: 16 }} 
          />
          
          {/* Kategoriya uchun skelet */}
          <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '40%' }} />
          {/* Sarlavha uchun skelet */}
          <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '80%' }} />
          {/* Muallif uchun skelet */}
          <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '60%' }} />
        </Box>
      </Card>
    </motion.div>
  );
};

export default BookCardSkeleton;
