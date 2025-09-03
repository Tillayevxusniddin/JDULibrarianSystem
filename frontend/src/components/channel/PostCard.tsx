import React, { useState } from 'react';
import { Box, Paper, Typography, Avatar, IconButton, Menu, MenuItem, Button, Divider, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CommentIcon from '@mui/icons-material/Comment';
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

  return (
    <Paper sx={{ p: {xs: 1, sm: 2}, mb: 2, maxWidth: 700, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link component={RouterLink} to={`/channels/${channel.linkName}`}>
            <Avatar src={logoUrl} sx={{ width: 40, height: 40 }}>
              {channel.name.charAt(0)}
            </Avatar>
          </Link>
          <Box>
            <Typography sx={{ fontWeight: 'bold' }}>{channel.name}</Typography>
            <Typography variant="caption" color="text.secondary">{new Date(post.createdAt).toLocaleString()}</Typography>
          </Box>
        </Box>
        {user?.id === post.authorId && (
          <IconButton onClick={handleClick}><MoreVertIcon /></IconButton>
        )}
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          <MenuItem onClick={() => { onEdit(post); handleClose(); }}>Tahrirlash</MenuItem>
          <MenuItem onClick={() => { onDelete(post.id); handleClose(); }} sx={{ color: 'error.main' }}>O'chirish</MenuItem>
        </Menu>
      </Box>
      
      {post.content && (
        <Typography sx={{ whiteSpace: 'pre-wrap', mb: postImageUrl ? 1 : 0, px: 1 }}>
            {post.content}
        </Typography>
      )}

      {postImageUrl && (
        <Box sx={{ mt: 1, borderRadius: (t) => t.customShape.radius.md, overflow: 'hidden', maxWidth: '100%', maxHeight: '500px' }}>
          <img 
            src={postImageUrl} 
            alt="Post content" 
            style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }} 
          />
        </Box>
      )}
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <ReactionSection post={post} />
        <Button size="small" startIcon={<CommentIcon />} onClick={() => onCommentClick(post)}>
          Izohlar
        </Button>
      </Box>
    </Paper>
  );
};

export default PostCard;
