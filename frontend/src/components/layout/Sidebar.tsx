// src/components/layout/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Badge,
  Avatar,
} from "@mui/material";
// Ikonkalarni import qilish
import DashboardIcon from "@mui/icons-material/Dashboard";
import BookIcon from "@mui/icons-material/Book";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AddCommentIcon from "@mui/icons-material/AddComment";
import CategoryIcon from "@mui/icons-material/Category";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import HistoryIcon from "@mui/icons-material/History";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import SchoolIcon from "@mui/icons-material/School";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";

import { useAuthStore } from "../../store/auth.store";
import { useNotificationStore } from "../../store/notification.store";
import { useUiStore } from "../../store/ui.store";

// Navigatsiya elementlari ro'yxati
const navItems = [
  {
    text: "Asosiy Sahifa",
    icon: <DashboardIcon />,
    path: "/",
    role: ["LIBRARIAN", "USER"],
  },
  // COMMENTED OUT - Channels feature not ready for release
  // { text: 'Mening Kanalim', icon: <RssFeedIcon />, path: '/my-channel', role: ['USER'], premiumOnly: true },
  // { text: 'Kanallar', icon: <DynamicFeedIcon />, path: '/channels', role: ['USER'] },
  {
    text: "Kitoblar",
    icon: <BookIcon />,
    path: "/books",
    role: ["LIBRARIAN", "USER"],
  },
  {
    text: "Mening Sevimlilarim",
    icon: <FavoriteIcon />,
    path: "/my-favorites",
    role: ["USER"],
  },
  {
    text: "Mening Ijaralarim",
    icon: <AssignmentIcon />,
    path: "/my-loans",
    role: ["USER"],
  },
  {
    text: "Ijara Tarixi",
    icon: <HistoryIcon />,
    path: "/my-rental-history",
    role: ["USER"],
  },
  // COMMENTED OUT - Reservation feature disabled
  /*
  {
    text: "Mening Rezervlarim",
    icon: <BookmarkAddedIcon />,
    path: "/my-reservations",
    role: ["USER"],
  },
  */
  {
    text: "Bildirishnomalar",
    icon: <NotificationsIcon />,
    path: "/notifications",
    role: ["LIBRARIAN", "USER"],
  },
  // COMMENTED OUT - Channels feature not ready for release
  // { text: 'Mening Obunalarim', icon: <SubscriptionsIcon />, path: '/my-subscriptions', role: ['USER'] },
  {
    text: "Kitob Taklif Qilish",
    icon: <AddCommentIcon />,
    path: "/suggest-book",
    role: ["USER"],
  },
  {
    text: "Mening Jarimalarim",
    icon: <MonetizationOnIcon />,
    path: "/my-fines",
    role: ["USER"],
  },
  {
    text: "Premium Olish",
    icon: <WorkspacePremiumIcon />,
    path: "/get-premium",
    role: ["USER"],
    hideWhenPremium: true,
  },
  {
    text: "Mening Profilim",
    icon: <AccountCircleIcon />,
    path: "/profile",
    role: ["LIBRARIAN", "USER"],
  },
  {
    text: "Menejer Paneli",
    icon: <SupervisorAccountIcon />,
    path: "/manager-panel",
    role: ["MANAGER"],
  },
];

const adminNavItems = [
  {
    text: "Ijaralar Boshqaruvi",
    icon: <FactCheckIcon />,
    path: "/all-loans",
    role: ["LIBRARIAN"],
  },
  // COMMENTED OUT - Reservation feature disabled
  /*
  {
    text: "Rezervlar Boshqaruvi",
    icon: <BookmarksIcon />,
    path: "/all-reservations",
    role: ["LIBRARIAN"],
  },
  */
  {
    text: "Kategoriyalar",
    icon: <CategoryIcon />,
    path: "/categories",
    role: ["LIBRARIAN"],
  },
  {
    text: "Takliflar",
    icon: <LightbulbIcon />,
    path: "/suggestions",
    role: ["LIBRARIAN"],
  },
  {
    text: "Jarimalar",
    icon: <AttachMoneyIcon />,
    path: "/fines",
    role: ["LIBRARIAN"],
  },
  {
    text: "Qo`lda Jarima Yozish",
    icon: <ReportProblemIcon />,
    path: "/manual-fines",
    role: ["LIBRARIAN"],
  },
  {
    text: "Foydalanuvchilar",
    icon: <PeopleIcon />,
    path: "/users",
    role: ["LIBRARIAN"],
  },
];

const SidebarContent: React.FC = () => {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  const renderNavItems = (items: typeof navItems) => {
    return items.map(
      (item) =>
        user &&
        item.role.includes(user.role) &&
        (!item.hideWhenPremium || !user.isPremium) && (
          <ListItem key={item.text} disablePadding sx={{ display: "block" }}>
            <NavLink
              to={item.path}
              style={{ textDecoration: "none", color: "inherit" }}
              onClick={() => setSidebarOpen(false)}
            >
              {({ isActive }) => (
                <ListItemButton
                  selected={isActive}
                  sx={{
                    minHeight: 48,
                    px: 2.5,
                    borderRadius: (t) => t.customShape.radius.sm,
                    margin: "4px 8px",
                    "&.Mui-selected": {
                      backgroundColor: "action.hover",
                      color: "primary.main",
                      fontWeight: "fontWeightBold",
                      "& .MuiListItemIcon-root": {
                        color: "primary.main",
                      },
                    },
                    "&.Mui-selected:hover": {
                      backgroundColor: "action.hover",
                      color: "primary.main",
                      fontWeight: "fontWeightBold",
                      "& .MuiListItemIcon-root": {
                        color: "primary.main",
                      },
                    },
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: 3 }}>
                    {item.text === "Bildirishnomalar" ? (
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
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(180deg, rgba(96, 165, 250, 0.1) 0%, transparent 100%)"
              : "transparent",
        }}
      >
        <Avatar
          sx={{
            width: 56,
            height: 56,
            mb: 1,
            bgcolor: "primary.main",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 4px 20px rgba(96, 165, 250, 0.3)"
                : "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <SchoolIcon />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Kutubxona
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user?.role === "LIBRARIAN" ? "Administrator" : "Foydalanuvchi"}
        </Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <List sx={{ flexGrow: 1, overflowY: "auto" }}>
        {renderNavItems(navItems)}
        {user?.role === "LIBRARIAN" && (
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
