import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { CircularProgress, Pagination, Chip, Tabs, Tab, Box, Typography, InputAdornment, TextField, Paper, Avatar } from '@mui/material';
import { Search, Star, Clock, TrendingUp } from 'lucide-react';
import api from '../api';
import type { Channel, PaginatedResponse, Post } from '../types';
import { useDebounce } from 'use-debounce';
import { useAuthStore } from '../store/auth.store';
import { useChannelScroll } from '../hooks/useChannelScroll';
import PostCard from '../components/channel/PostCard';
import CommentDrawer from '../components/channel/CommentDrawer';
import EditPostModal from '../components/channel/EditPostModal';

const ChannelsListPage: React.FC = () => {
  const { user } = useAuthStore();
  
  // Use the custom hook to disable main layout scrolling
  useChannelScroll();
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [editPost, setEditPost] = useState<Post | null>(null);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Channel>>('/channels', {
        params: { page, limit: 12, search: debouncedSearchTerm || undefined },
      });
      setChannels(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (err) {
      // toast.error('Kanallarni yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchTerm]);

  const fetchAllPosts = useCallback(async () => {
    if (!user?.isPremium) return;
    setPostsLoading(true);
    try {
      const response = await api.get('/posts/all-posts'); // New endpoint for all users' posts
      // Sort by creation date (newest first)
      const sortedPosts = response.data.data.sort((a: Post, b: Post) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllPosts(sortedPosts);
    } catch (err) {
      // Handle error
    } finally {
      setPostsLoading(false);
    }
  }, [user?.isPremium]);
  
  useEffect(() => {
    if (activeTab === 0) {
      fetchChannels();
    }
  }, [fetchChannels, activeTab]);

  useEffect(() => {
    if (user?.isPremium && activeTab === 1) {
      fetchAllPosts();
    }
  }, [fetchAllPosts, activeTab, user?.isPremium]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setAllPosts(prevPosts => 
      prevPosts.map(post => post.id === updatedPost.id ? updatedPost : post)
    );
  };

  const handlePostDeleted = (postId: string) => {
    setAllPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  // Get recommended post (latest) and other posts
  const recommendedPost = allPosts.length > 0 ? allPosts[0] : null;
  const otherPosts = allPosts.slice(1);

  return (
    // --- LAYOUT O'ZGARISHLARI: Asosiy flex konteyner ---
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 1. YUQORI QISM (SARLAVHA, QIDIRUV, TAB'LAR) - qotib turadi */}
      <Box sx={{ p: 2, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Kanallar</Typography>
            {user?.isPremium && <Chip icon={<Star fontSize="small" />} label="Premium" color="primary" variant="filled" />}
          </Box>
          <TextField
            placeholder="Kanallarni qidirish..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search size={20} /></InputAdornment>,
              sx: { borderRadius: 2, width: { xs: '100%', sm: '320px' } }
            }}
          />
        </Box>
        {user?.isPremium && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
              <Tab icon={<Search />} label="Barcha Kanallar" iconPosition="start" value={0} />
              <Tab icon={<TrendingUp />} label="Barcha Postlar" iconPosition="start" value={1} />
            </Tabs>
          </Box>
        )}
      </Box>

      {/* 2. O'RTA QISM (KONTENT) - faqat shu joy scroll bo'ladi */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, minHeight: 0 }}>
        {activeTab === 0 || !user?.isPremium ? (
          <>
            {loading && channels.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {channels.map(channel => (
                    <RouterLink key={channel.id} to={`/channels/${channel.linkName}`} style={{ textDecoration: 'none' }}>
                      <Paper 
                        elevation={3}
                        sx={{ 
                          p: 3, 
                          borderRadius: 3, 
                          height: '100%',
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': { 
                            transform: 'translateY(-8px) scale(1.02)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.95) 100%)',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar 
                            src={channel.logoImage ? `http://localhost:5000${channel.logoImage}` : undefined} 
                            sx={{ 
                              width: 56, 
                              height: 56,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              fontSize: '1.5rem',
                              fontWeight: 'bold',
                              border: '3px solid rgba(255,255,255,0.8)',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            }}
                          >
                            {channel.name.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 'bold', 
                                mb: 0.5,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {channel.name}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              @{channel.linkName}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip 
                            label={`${channel._count?.followers || 0} obunachi`}
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                              color: 'primary.main',
                              fontWeight: 'bold',
                              border: '1px solid rgba(102, 126, 234, 0.2)'
                            }}
                          />
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
                            }} 
                          />
                        </Box>
                        
                        {channel.bio && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mt: 2,
                              p: 2,
                              bgcolor: 'rgba(248, 250, 252, 0.8)',
                              borderRadius: 2,
                              fontStyle: 'italic',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.4
                            }}
                          >
                            "{channel.bio}"
                          </Typography>
                        )}
                      </Paper>
                    </RouterLink>
                  ))}
                </div>
                {!loading && channels.length === 0 && (
                  <Paper 
                    elevation={3}
                    sx={{ 
                      py: 8, 
                      textAlign: 'center',
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                    }}
                  >
                    <Box sx={{ mb: 3 }}>
                      <Search size={64} style={{ color: 'rgba(0,0,0,0.3)' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                      Hech qanday kanal topilmadi
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Boshqa qidiruv so'zini sinab ko'ring yoki yangi kanal yarating
                    </Typography>
                  </Paper>
                )}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <Paper 
                      elevation={4}
                      sx={{ 
                        p: 3, 
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      <Pagination 
                        count={totalPages} 
                        page={page} 
                        onChange={(_, value) => setPage(value)} 
                        color="primary"
                        size="large"
                        sx={{
                          '& .MuiPaginationItem-root': {
                            fontWeight: 'bold',
                            '&:hover': {
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            }
                          }
                        }}
                      />
                    </Paper>
                  </Box>
                )}
              </>
            )}
          </>
        ) : (
          <Box sx={{ maxWidth: 'lg', mx: 'auto', width: '100%' }}>
            {postsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : allPosts.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Recommended Post as a small icon/booklet link */}
                {recommendedPost && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <RouterLink to={`/channels/${recommendedPost.channel?.linkName}/post/${recommendedPost.id}`} style={{ textDecoration: 'none' }}>
                      <Paper elevation={6} sx={{ p: 1, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'primary.light', color: 'primary.contrastText', boxShadow: 3 }}>
                        <Avatar src={recommendedPost.channel?.logoImage ? `http://localhost:5000${recommendedPost.channel.logoImage}` : undefined} sx={{ width: 32, height: 32, mr: 1 }}>
                          {recommendedPost.channel?.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                          Tavsiya: {recommendedPost.content ? recommendedPost.content.slice(0, 32) + '...' : 'Post'}
                        </Typography>
                        <Chip label="Yangi" color="secondary" size="small" />
                      </Paper>
                    </RouterLink>
                  </Box>
                )}
                {/* Feed of all posts */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {allPosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      channel={post.channel!}
                      onDelete={handlePostDeleted}
                      onEdit={setEditPost}
                      onCommentClick={setCommentPost}
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Paper 
                elevation={3}
                sx={{ 
                  py: 8, 
                  textAlign: 'center',
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                }}
              >
                <Box sx={{ mb: 3 }}>
                  <TrendingUp size={64} style={{ color: 'rgba(0,0,0,0.3)' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                  Hali postlar mavjud emas
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Foydalanuvchilar tomonidan yaratilgan postlar bu yerda ko'rinadi
                </Typography>
              </Paper>
            )}
          </Box>
        )}
      </Box>

      {/* Modals */}
      <CommentDrawer post={commentPost} open={!!commentPost} onClose={() => setCommentPost(null)} />
      <EditPostModal post={editPost} open={!!editPost} onClose={() => setEditPost(null)} onPostUpdated={handlePostUpdated} />
    </Box>
  );
};

export default ChannelsListPage;