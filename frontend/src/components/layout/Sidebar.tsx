// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Typography, Badge, Avatar } from '@mui/material';
// Ikonkalarni import qilish
import DashboardIcon from '@mui/icons-material/Dashboard';
import BookIcon from '@mui/icons-material/Book';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddCommentIcon from '@mui/icons-material/AddComment';
import CategoryIcon from '@mui/icons-material/Category';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SchoolIcon from '@mui/icons-material/School';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
// Removed premium/channels-related icons to restore previous set


import { useAuthStore } from '../../store/auth.store';
import { useNotificationStore } from '../../store/notification.store';
import { useUiStore } from '../../store/ui.store';

// Navigatsiya elementlari ro'yxati
const navItems = [
    { text: 'Asosiy Sahifa', icon: <DashboardIcon />, path: '/', role: ['LIBRARIAN', 'USER'] },
    // Restored: removed channel-related items introduced later
    { text: 'Kitoblar', icon: <BookIcon />, path: '/books', role: ['LIBRARIAN', 'USER'] },
    { text: 'Mening Ijaralarim', icon: <AssignmentIcon />, path: '/my-loans', role: ['USER'] },
    { text: 'Mening Rezervlarim', icon: <BookmarkAddedIcon />, path: '/my-reservations', role: ['USER'] },
    { text: 'Bildirishnomalar', icon: <NotificationsIcon />, path: '/notifications', role: ['LIBRARIAN', 'USER'] },
    // Restored: removed subscriptions item introduced later
    { text: 'Kitob Taklif Qilish', icon: <AddCommentIcon />, path: '/suggest-book', role: ['USER'] },
    { text: 'Mening Jarimalarim', icon: <MonetizationOnIcon />, path: '/my-fines', role: ['USER'] },
    // Restored: removed premium item introduced later
    { text: 'Mening Profilim', icon: <AccountCircleIcon />, path: '/profile', role: ['LIBRARIAN', 'USER'] },
];

const adminNavItems = [
    { text: 'Ijaralar Boshqaruvi', icon: <FactCheckIcon />, path: '/all-loans', role: ['LIBRARIAN'] },
    { text: 'Rezervlar Boshqaruvi', icon: <BookmarksIcon />, path: '/all-reservations', role: ['LIBRARIAN'] },
    { text: 'Kategoriyalar', icon: <CategoryIcon />, path: '/categories', role: ['LIBRARIAN'] },
    { text: 'Takliflar', icon: <LightbulbIcon />, path: '/suggestions', role: ['LIBRARIAN'] },
    { text: 'Jarimalar', icon: <AttachMoneyIcon />, path: '/fines', role: ['LIBRARIAN'] },
    { text: 'Qo`lda Jarima Yozish', icon: <ReportProblemIcon />, path: '/manual-fines', role: ['LIBRARIAN'] },
    { text: 'Foydalanuvchilar', icon: <PeopleIcon />, path: '/users', role: ['LIBRARIAN'] },
];

const SidebarContent: React.FC = () => {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  const renderNavItems = (items: typeof navItems) => {
    return items.map((item) => (
      user && item.role.includes(user.role) && (!item.premiumOnly || user.isPremium) && (!item.hideWhenPremium || !user.isPremium) && (
        <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
          <NavLink to={item.path} style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setSidebarOpen(false)}>
            {({ isActive }) => (
              <ListItemButton
                selected={isActive}
                sx={{
                  minHeight: 48,
                  px: 2.5,
                  borderRadius: (t) => t.customShape.radius.sm,
                  margin: '4px 8px',
                  '&.Mui-selected': {
                    backgroundColor: 'action.hover',
                    color: 'primary.main',
                    fontWeight: 'fontWeightBold',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'action.hover',
                    color: 'primary.main',
                    fontWeight: 'fontWeightBold',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 3 }}>
                  {item.text === 'Bildirishnomalar' ? (
                    <Badge badgeContent={unreadCount} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            )}
          </NavLink>
        </ListItem>
      )
    ));
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Avatar sx={{ width: 56, height: 56, mb: 1, bgcolor: 'primary.main' }}>
            <SchoolIcon/>
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Kutubxona
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user?.role === 'LIBRARIAN' ? 'Administrator' : 'Foydalanuvchi'}
        </Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {renderNavItems(navItems)}
        {user?.role === 'LIBRARIAN' && (
            <>
                <Divider sx={{ my: 2 }}>Admin Panel</Divider>
                {renderNavItems(adminNavItems)}
            </>
        )}
      </List>
    </Box>
  );
};

export default SidebarContent;
