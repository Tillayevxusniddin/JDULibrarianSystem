import React, { useState } from 'react';
import { Box, Paper, Typography, Avatar, IconButton, Menu, MenuItem, Button, Divider, Link, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CommentIcon from '@mui/icons-material/Comment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuthStore } from '../../store/auth.store';
import type { Post, Channel } from '../../types';
import ReactionSection from './ReactionSection';

interface PostCardProps {
  post: Post;
  channel: Channel;
  onDelete: (postId: string) => void;
  onEdit: (post: Post) => void;
  onCommentClick: (post: Post) => void;
}

// --- YECHIM SHU YERDA: `channel` prop'i qo'shildi ---
const PostCard: React.FC<PostCardProps> = ({ post, channel, onDelete, onEdit, onCommentClick }) => {
  const { user } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const logoUrl = channel.logoImage ? `http://localhost:5000/public${channel.logoImage}` : undefined;
  const postImageUrl = post.postImage ? `http://localhost:5000${post.postImage}` : undefined;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hozirgina';
    if (diffInHours < 24) return `${diffInHours} soat oldin`;
    if (diffInHours < 48) return 'Kecha';
    return date.toLocaleDateString('uz-UZ');
  };

  const isNewPost = () => {
    const postDate = new Date(post.createdAt);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return postDate > oneDayAgo;
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        maxWidth: 700, 
        width: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.shadows[8],
          borderColor: 'primary.main',
        },
        background: 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899)',
          opacity: isNewPost() ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }
      }}
    >
      {/* New Post Indicator */}
      {isNewPost() && (
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Chip 
            size="small" 
            label="Yangi" 
            color="primary"
            sx={{
              background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
              color: 'white',
              fontWeight: 'bold',
              '& .MuiChip-label': {
                px: 1,
              }
            }}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Link component={RouterLink} to={`/channels/${channel.linkName}`} sx={{ textDecoration: 'none' }}>
            <Avatar 
              src={logoUrl} 
              sx={{ 
                width: 48, 
                height: 48,
                border: '2px solid',
                borderColor: 'primary.main',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: (theme) => theme.shadows[4],
                }
              }}
            >
              {channel.name.charAt(0)}
            </Avatar>
          </Link>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Link 
              component={RouterLink} 
              to={`/channels/${channel.linkName}`}
              sx={{ 
                textDecoration: 'none',
                '&:hover .channel-name': {
                  color: 'primary.main',
                }
              }}
            >
              <Typography 
                className="channel-name"
                sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '1.1rem',
                  color: 'text.primary',
                  transition: 'color 0.2s ease',
                }}
              >
                {channel.name}
              </Typography>
            </Link>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {formatDate(post.createdAt)}
              </Typography>
            </Box>
          </Box>
        </Box>
        {user?.id === post.authorId && (
          <IconButton 
            onClick={handleClick}
            sx={{
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'rotate(90deg)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <MoreVertIcon />
          </IconButton>
        )}
        <Menu 
          anchorEl={anchorEl} 
          open={open} 
          onClose={handleClose}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: (theme) => theme.shadows[8],
            }
          }}
        >
          <MenuItem 
            onClick={() => { onEdit(post); handleClose(); }}
            sx={{ gap: 1, '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' } }}
          >
            Tahrirlash
          </MenuItem>
          <MenuItem 
            onClick={() => { onDelete(post.id); handleClose(); }} 
            sx={{ 
              color: 'error.main', 
              gap: 1,
              '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' }
            }}
          >
            O'chirish
          </MenuItem>
        </Menu>
      </Box>
      
      {post.content && (
        <RouterLink 
          to={`/channels/${channel.linkName}/posts/${post.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Box
            sx={{
              mb: postImageUrl ? 2 : 1,
              p: 2,
              borderRadius: 2,
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.200',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'grey.100',
                transform: 'translateY(-1px)',
                boxShadow: (theme) => theme.shadows[2],
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                bgcolor: 'primary.main',
                borderRadius: '0 2px 2px 0',
              }
            }}
          >
            <Typography 
              sx={{ 
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                fontSize: '0.95rem',
                color: 'text.primary',
              }}
            >
              {post.content}
            </Typography>
          </Box>
        </RouterLink>
      )}

      {postImageUrl && (
        <RouterLink 
          to={`/channels/${channel.linkName}/posts/${post.id}`}
          style={{ textDecoration: 'none' }}
        >
          <Box 
            sx={{ 
              mt: 1, 
              borderRadius: 3, 
              overflow: 'hidden', 
              maxWidth: '100%', 
              maxHeight: '400px',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: (theme) => theme.shadows[4],
              },
              '&:hover .image-overlay': {
                opacity: 1,
              }
            }}
          >
            <img 
              src={postImageUrl} 
              alt="Post content" 
              style={{ 
                width: '100%', 
                height: 'auto', 
                objectFit: 'cover', 
                display: 'block',
                transition: 'transform 0.3s ease',
              }} 
            />
            <Box 
              className="image-overlay"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.7)',
                  p: 1,
                  borderRadius: 1,
                  fontWeight: 'bold'
                }}
              >
                Batafsil ko'rish
              </Typography>
            </Box>
          </Box>
        </RouterLink>
      )}
      
      <Divider sx={{ my: 2, opacity: 0.6 }} />
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <ReactionSection post={post} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            size="small" 
            startIcon={<CommentIcon />} 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCommentClick(post);
            }}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Izohlar
          </Button>
          <Button 
            size="small" 
            component={RouterLink}
            to={`/channels/${channel.linkName}/posts/${post.id}`}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Batafsil
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default PostCard;
