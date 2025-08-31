// src/pages/DashboardPage.tsx

import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress} from '@mui/material';
import { useAuthStore } from '../store/auth.store';
import api from '../api';
import toast from 'react-hot-toast';

// Ikonkalarni import qilamiz
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import StatCard from '../components/dashboard/StatCard'; // StatCard komponentimiz

// Turlar (o'zgarishsiz)
interface LibrarianStats {
  totalBookTitles: number;
  totalBookCopies: number;
  borrowedCopies: number;
  availableCopies: number;
  totalUsers: number;
  newSuggestions: number;
}

interface UserStats {
  activeLoans: number;
  activeReservations: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<LibrarianStats | UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await api.get('/dashboard/stats');
        
        // --- YECHIM SHU YERDA ---
        // Backenddan kelayotgan ma'lumot qobiqqa o'ralgan bo'lishi mumkinligini hisobga olamiz
        setStats(response.data.data || response.data);
        
      } catch (error) {
        toast.error("Statistikani yuklashda xatolik yuz berdi.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

   return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        Xush kelibsiz, {user?.firstName}!
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {user?.role === 'USER' ? 'Bu sizning shaxsiy kabinetingiz.' : 'Bu sizning boshqaruv panelingiz.'}
      </Typography>

      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* Kutubxonachi uchun kartalar (o'zgarishsiz) */}
          {(user?.role === 'LIBRARIAN' || user?.role === 'MANAGER') && (stats as LibrarianStats) && (
            <>
              <div className="col-span-1">
                <StatCard 
                  title="Jami Kitob Nomlari" 
                  value={(stats as LibrarianStats).totalBookTitles} 
                  icon={<MenuBookIcon />} 
                  color="#1976d2" 
                />
              </div>
              <div className="col-span-1">
                <StatCard 
                  title="Jami Jismoniy Nusxalar" 
                  value={(stats as LibrarianStats).totalBookCopies} 
                  icon={<LibraryBooksIcon />} 
                  color="#388e3c" 
                />
              </div>
              <div className="col-span-1">
                <StatCard 
                  title="Ijaradagi Nusxalar" 
                  value={(stats as LibrarianStats).borrowedCopies} 
                  icon={<AssignmentLateIcon />} 
                  color="#d32f2f" 
                />
              </div>
              <div className="col-span-1">
                <StatCard 
                  title="Foydalanuvchilar Soni" 
                  value={(stats as LibrarianStats).totalUsers} 
                  icon={<PeopleAltIcon />} 
                  color="#f57c00" 
                />
              </div>
            </>
          )}

          {/* Oddiy foydalanuvchi uchun kartalar (YANGILANGAN) */}
          {user?.role === 'USER' && (stats as UserStats) && (
            <>
              {/* --- O'ZGARISH: `to` prop'i qo'shildi --- */}
              <div className="col-span-1 sm:col-span-1">
                <StatCard 
                  title="Aktiv Ijaralarim" 
                  value={(stats as UserStats).activeLoans} 
                  icon={<FactCheckIcon />} 
                  color="#1976d2" 
                  to="/my-loans" 
                />
              </div>
              
              {/* --- O'ZGARISH: `to` prop'i qo'shildi --- */}
              <div className="col-span-1 sm:col-span-1">
                <StatCard 
                  title="Aktiv Rezervlarim" 
                  value={(stats as UserStats).activeReservations} 
                  icon={<BookmarkAddedIcon />} 
                  color="#388e3c"
                  to="/my-reservations"
                />
              </div>
            </>
          )}
        </div>
      )}
    </Box>
  );
};

export default DashboardPage;