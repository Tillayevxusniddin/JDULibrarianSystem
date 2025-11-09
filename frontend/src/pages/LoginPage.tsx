import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  CircularProgress,
  Box,
  Paper,
  Avatar,
  Divider,
  IconButton,
} from "@mui/material";
import { motion } from "framer-motion";
import api from "../api";
import { useAuthStore } from "../store/auth.store";
import SchoolIcon from "@mui/icons-material/School";
import toast from "react-hot-toast";
import GoogleIcon from "@mui/icons-material/Google";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useUiStore } from "../store/ui.store";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const { themeMode, toggleTheme } = useUiStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      await login(response.data.token);
      toast.success("Tizimga muvaffaqiyatli kirildi!");
      navigate("/");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Email yoki parol noto'g'ri.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginClick = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        position: "relative",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at 20% 50%, rgba(96, 165, 250, 0.15) 0%, transparent 50%),
             radial-gradient(circle at 80% 80%, rgba(244, 114, 182, 0.15) 0%, transparent 50%),
             ${theme.palette.background.default}`
            : `radial-gradient(circle at 10% 20%, rgb(215, 227, 255) 0%, rgb(240, 243, 250) 90.2%)`,
      }}
    >
      {/* Theme Toggle Button */}
      <IconButton
        onClick={toggleTheme}
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          bgcolor: "background.paper",
          boxShadow: 2,
          "&:hover": {
            bgcolor: "background.paper",
            transform: "scale(1.1)",
          },
          transition: "all 0.3s ease",
        }}
      >
        {themeMode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, sm: 5 },
            width: "100%",
            maxWidth: 420,
            borderRadius: 4,
            backdropFilter: "blur(10px)",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(30, 41, 59, 0.8)"
                : "rgba(255, 255, 255, 0.8)",
            border: (theme) =>
              theme.palette.mode === "dark"
                ? "1px solid rgba(148, 163, 184, 0.2)"
                : "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 8px 32px rgba(0, 0, 0, 0.5)"
                : "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Avatar
              sx={{
                m: 1,
                bgcolor: "primary.main",
                width: 56,
                height: 56,
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 4px 20px rgba(96, 165, 250, 0.4)"
                    : "0 4px 20px rgba(0, 0, 0, 0.2)",
              }}
            >
              <SchoolIcon />
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ fontWeight: "bold" }}>
              Kutubxona Tizimi
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Tizimga kirish uchun hisobingizga kiring
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Manzil"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Parol"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)"
                    : undefined,
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 4px 20px rgba(96, 165, 250, 0.4)"
                    : undefined,
                "&:hover": {
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                      : undefined,
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Kirish"
              )}
            </Button>

            <Divider sx={{ my: 2 }}>YOKI</Divider>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLoginClick}
              sx={{
                borderRadius: 2,
                borderWidth: 2,
                "&:hover": {
                  borderWidth: 2,
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(96, 165, 250, 0.08)"
                      : undefined,
                },
              }}
            >
              Google orqali kirish
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default LoginPage;
