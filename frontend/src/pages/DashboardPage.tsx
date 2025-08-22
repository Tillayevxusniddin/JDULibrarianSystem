import React, { useEffect, useState } from 'react';
import { Typography, Box, CircularProgress } from '@mui/material';
import { useAuthStore } from '../store/auth.store';
import StatCard from '../components/dashboard/StatCard';
import BookIcon from '@mui/icons-material/Book';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion'; // <-- O'ZGARISH SHU YERDA
import api from '../api';
import toast from 'react-hot-toast';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

// Statistikani saqlash uchun tip
interface StatsData {
  [key: string]: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/stats');
        setStats(response.data.data);
      } catch (error) {
        toast.error('Statistikani yuklashda xatolik yuz berdi.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const librarianStats = stats ? [
    { title: "Jami Kitoblar", value: stats.totalBooks, icon: <BookIcon />, color: "#1976d2" },
    { title: "Jami Foydalanuvchilar", value: stats.totalUsers, icon: <PeopleIcon />, color: "#388e3c" },
    { title: "Yangi Takliflar", value: stats.newSuggestions, icon: <LightbulbIcon />, color: "#f57c00" },
  ] : [];

  const userStats = stats ? [
    { title: "Mening Ijaralarim", value: stats.activeLoans, icon: <AssignmentIcon />, color: "#7b1fa2" },
    { title: "Mening Rezervlarim", value: stats.activeReservations, icon: <BookIcon />, color: "#00796b" },
  ] : [];

  const displayStats = user?.role === 'LIBRARIAN' ? librarianStats : userStats;

  return (
    <Box>
      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Xush kelibsiz, {user?.firstName}!
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Bu sizning shaxsiy boshqaruv panelingiz.
        </Typography>
      </motion.div>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {displayStats.map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
              <StatCard {...stat} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </Box>
  );
};

export default DashboardPage;
