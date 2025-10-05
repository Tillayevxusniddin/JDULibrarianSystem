import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SidebarContent from './Sidebar';
import { Box, Drawer, IconButton, AppBar, Toolbar, Typography, Avatar } from '@mui/material';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/ui.store';
import { useScrollControl } from '../../contexts/ScrollContext';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { motion, AnimatePresence } from 'framer-motion';

const drawerWidth = 260;

const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, setSidebarOpen, themeMode, toggleTheme } = useUiStore();
  const { disableMainScroll } = useScrollControl();
  const location = useLocation();

  const handleDrawerToggle = () => setSidebarOpen(!isSidebarOpen);

  const avatarUrl = user?.profilePicture

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          <IconButton color="inherit" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: 'none' } }}><MenuIcon /></IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">{themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}</IconButton>
          <Typography sx={{ mx: 2 }}>{user?.firstName} {user?.lastName}</Typography>
          <Avatar src={avatarUrl} sx={{ bgcolor: 'secondary.main' }}>{user?.firstName?.charAt(0)}</Avatar>
          <IconButton sx={{ ml: 1 }} onClick={logout} color="inherit"><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={isSidebarOpen} onClose={handleDrawerToggle} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, borderWidth: 0 } }}>
          <SidebarContent />
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, borderWidth: 0 } }} open>
          <SidebarContent />
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          display: 'flex',
          flexDirection: 'column',
          height: '100vh', // Bu muhim!
        }}
      >
        <Toolbar /> {/* AppBar uchun bo'sh joy */}
        
        {/* BU YERDA ASOSIY O'ZGARISH */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            p: 3, 
            // `disableMainScroll` holatiga qarab `overflow`ni boshqaramiz
            overflowY: disableMainScroll ? 'hidden' : 'auto', 
            // Bu muhim! `flex` konteyner ichidagi element to'liq balandlikni egallashi uchun
            height: 'calc(100% - 64px)',
          }}
        >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                // Agar scroll o'chirilgan bo'lsa, bu `div` ham to'liq balandlikni egallashi kerak
                style={{ height: disableMainScroll ? '100%' : 'auto' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
