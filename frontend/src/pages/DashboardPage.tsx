// src/pages/DashboardPage.tsx
import React from 'react';
import { Typography, Box } from '@mui/material';
import { useAuthStore } from '../store/auth.store';
import StatCard from '../components/dashboard/StatCard';
import BookIcon from '@mui/icons-material/Book';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
// Variants tipini "import type" orqali import qilamiz
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

// Animatsiya uchun variantlarga aniq tip beramiz
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

const DashboardPage: React.FC = () => {
    const { user } = useAuthStore();

    const librarianStats = [
        { title: "Jami Kitoblar", value: "1,250", icon: <BookIcon />, color: "#1976d2" },
        { title: "Jami Foydalanuvchilar", value: "340", icon: <PeopleIcon />, color: "#388e3c" },
        { title: "Yangi Takliflar", value: "12", icon: <LightbulbIcon />, color: "#f57c00" },
    ];
    
    const userStats = [
        { title: "Mening Ijaralarim", value: "3", icon: <AssignmentIcon />, color: "#7b1fa2" },
        { title: "Mening Rezervlarim", value: "1", icon: <BookIcon />, color: "#00796b" },
    ];

    const stats = user?.role === 'LIBRARIAN' ? librarianStats : userStats;

    return (
        <Box>
            <motion.div variants={itemVariants}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Xush kelibsiz, {user?.firstName}!
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 4 }}>
                    Bu sizning shaxsiy boshqaruv panelingiz.
                </Typography>
            </motion.div>

            <motion.div
                className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {stats.map((stat, index) => (
                    <motion.div key={index} variants={itemVariants}>
                        <StatCard {...stat} />
                    </motion.div>
                ))}
            </motion.div>
        </Box>
    );
};

export default DashboardPage;
