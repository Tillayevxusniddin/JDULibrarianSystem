import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  InputBase, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Switch, 
  FormControlLabel, 
  Pagination, 
  CircularProgress,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../api';
import type { User, PaginatedResponse } from '../../types';
import toast from 'react-hot-toast';
import { useDebounce } from 'use-debounce';

const ManagerPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchLoading, setSwitchLoading] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<User>>('/users', {
        params: { page, limit: 10, search: debouncedSearchTerm || undefined },
      });
      setUsers(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Foydalanuvchilarni yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePremiumToggle = async (userId: string, currentStatus: boolean) => {
    setSwitchLoading(userId);
    
    // Optimistic update
    const newStatus = !currentStatus;
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, isPremium: newStatus }
          : user
      )
    );
    
    try {
      const response = await api.put(`/users/${userId}/premium`, { 
        isPremium: newStatus 
      });
      
      console.log('Premium status update response:', response.data);
      toast.success(
        `Premium status muvaffaqiyatli ${newStatus ? 'yoqildi' : 'o\'chirildi'}!`
      );
      
      // Ma'lumotlarni qayta yuklash (server tomonidan yangilangan ma'lumotlarni olish)
      setTimeout(() => {
        fetchUsers();
      }, 1000); // 1 soniya kutib, keyin qayta yuklash
      
    } catch (error: any) {
      console.error('Premium toggle error:', error);
      
      // Optimistic update'ni bekor qilish
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, isPremium: currentStatus }
            : user
        )
      );
      
      toast.error(
        error?.response?.data?.message || "Statusni o'zgartirishda xatolik yuz berdi."
      );
    } finally {
      setSwitchLoading(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Premium Statusni Boshqarish
      </Typography>
      
      <Paper sx={{ 
        p: '2px 4px', 
        display: 'flex', 
        alignItems: 'center', 
        width: { xs: '100%', md: 400 }, 
        mb: 3, 
        borderRadius: '12px' 
      }}>
        <InputBase 
          sx={{ ml: 1, flex: 1 }} 
          placeholder="Foydalanuvchilarni qidirish..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
      </Paper>
      
      <Paper sx={{ borderRadius: 4 }}>
        {loading && users.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {users.map(user => (
              <ListItem 
                key={user.id}
                sx={{
                  backgroundColor: user.isPremium ? 'rgba(255, 193, 7, 0.1)' : 'transparent',
                  borderLeft: user.isPremium ? '4px solid #ffc107' : 'none',
                }}
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {user.isPremium && (
                      <Chip 
                        label="Premium" 
                        color="warning" 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                    {switchLoading === user.id ? (
                      <CircularProgress size={24} />
                    ) : (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={user.isPremium}
                            onChange={() => handlePremiumToggle(user.id, user.isPremium)}
                            color="warning"
                          />
                        }
                        label="Premium"
                      />
                    )}
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar 
                    src={user.profilePicture ? `http://localhost:5000/public${user.profilePicture}` : undefined}
                  >
                    {user.firstName.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={`${user.firstName} ${user.lastName}`} 
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rol: {user.role} | Status: {user.status}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={(_, value) => setPage(value)} 
            color="primary" 
          />
        </Box>
      )}
    </Box>
  );
};

export default ManagerPage;