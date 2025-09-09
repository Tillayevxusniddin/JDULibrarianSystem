import { useEffect, useMemo } from 'react';
import { useAuthStore } from './store/auth.store.js';
import AppRouter from './routes/index.js';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useUiStore } from './store/ui.store.js';
import { ScrollProvider } from './contexts/ScrollContext.js';
import { getDesignTokens } from './theme.js';
import { socket } from './api/socket.js'; // Socket mijozini import qilamiz

function App() {
  const { user, checkAuth, logout } = useAuthStore();
  const { themeMode } = useUiStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const syncTabs = (event: StorageEvent) => {
      // Agar boshqa vkladkada token o'chirilsa (logout)
      if (event.key === 'authToken' && !event.newValue) {
        logout(); // `logout` funksiyasini to'g'ridan-to'g'ri chaqiramiz
      }
      // Agar boshqa vkladkada token o'zgarsa (login)
      if (event.key === 'authToken' && event.newValue) {
        checkAuth();
      }
    };
    window.addEventListener('storage', syncTabs);
    return () => {
      window.removeEventListener('storage', syncTabs);
    };
  }, [checkAuth, logout]);

  // --- SOCKET.IO ULANISHINI BOSHQARISH EFFEKTI ---
  useEffect(() => {
    if (user) {
      // Agar foydalanuvchi tizimga kirgan bo'lsa
      socket.connect(); // Serverga ulanamiz
      // Serverga o'zimizning shaxsiy "xona"mizga qo'shilish uchun ID'mizni yuboramiz
      socket.emit('joinRoom', user.id);
    } else {
      // Agar foydalanuvchi tizimdan chiqqan bo'lsa
      socket.disconnect(); // Server bilan aloqani uzamiz
    }

    // Komponent yo'q qilinganda (masalan, sahifa yopilganda) aloqani uzish
    return () => {
      socket.disconnect();
    };
  }, [user]); // Bu effekt faqat `user` obyekti o'zgarganda (login/logout) ishlaydi

  const theme = useMemo(() => createTheme(getDesignTokens(themeMode)), [themeMode]);

  return (
    <ScrollProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppRouter />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
          }}
        />
      </ThemeProvider>
    </ScrollProvider>
  );
}

export default App;
