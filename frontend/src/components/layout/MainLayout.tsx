// src/components/layout/MainLayout.tsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SidebarContent from './Sidebar';
import { Box, Drawer, IconButton, AppBar, Toolbar, Typography, Avatar } from '@mui/material';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/ui.store';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { motion, AnimatePresence } from 'framer-motion';

const drawerWidth = 260; // Sidebar kengligi

const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, setSidebarOpen, themeMode, toggleTheme } = useUiStore();
  const location = useLocation(); // Joriy sahifa yo'lini olish uchun

  const handleDrawerToggle = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const avatarUrl = user?.profilePicture
    ? `http://localhost:5000/public${user.profilePicture}`
    : undefined;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh'}}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Kichik ekranlar uchun vaqtinchalik ochiladigan Sidebar */}
        <Drawer
          variant="temporary"
          open={isSidebarOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          <SidebarContent />
        </Drawer>
        {/* Katta ekranlar uchun doimiy Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          <SidebarContent />
        </Drawer>
      </Box>

      {/* Asosiy kontent qismi */}
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` } }}
      >
        {/* Header (AppBar) */}
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
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
              {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <Typography sx={{ mx: 2 }}>{user?.firstName} {user?.lastName}</Typography>
            <Avatar src={avatarUrl} sx={{ bgcolor: 'secondary.main' }}>
              {/* Agar rasm bo'lmasa, ismning birinchi harfi ko'rinadi */}
              {user?.firstName.charAt(0)}
            </Avatar>
            <IconButton sx={{ ml: 1 }} onClick={logout} color="inherit">
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        {/* Sahifa kontenti va animatsiyasi */}
        <Toolbar /> 
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname} // Har bir sahifa uchun unikal kalit
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default MainLayout;
