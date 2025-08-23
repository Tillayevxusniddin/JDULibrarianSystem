import React from 'react';
import { Box, Typography, Avatar, IconButton, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import { useAuthStore } from '../../store/auth.store';
import type { PostComment } from '../../types';

interface CommentItemProps {
  comment: PostComment;
  onReply: (comment: PostComment) => void;
  onDelete: (commentId: string) => void;
  channelOwnerId: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply, onDelete, channelOwnerId }) => {
  const { user } = useAuthStore();
  const canDelete = user?.id === comment.user.id || user?.id === channelOwnerId;
  const avatarUrl = comment.user.profilePicture ? `http://localhost:5000/public${comment.user.profilePicture}` : undefined;

  return (
    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
      <Avatar src={avatarUrl} sx={{ width: 32, height: 32 }}>
        {comment.user.firstName.charAt(0)}
      </Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {comment.user.firstName} {comment.user.lastName}
            </Typography>
            {canDelete && (
              <IconButton size="small" onClick={() => onDelete(comment.id)}>
                <DeleteIcon fontSize="inherit" color="error" />
              </IconButton>
            )}
          </Box>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {comment.content}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {new Date(comment.createdAt).toLocaleTimeString()}
          </Typography>
          <Button size="small" startIcon={<ReplyIcon />} onClick={() => onReply(comment)}>
            Javob yozish
          </Button>
        </Box>
        {/* Javoblarni rekursiv tarzda chizish */}
        {comment.replies?.map(reply => (
          <CommentItem 
            key={reply.id} 
            comment={reply} 
            onReply={onReply} 
            onDelete={onDelete}
            channelOwnerId={channelOwnerId}
          />
        ))}
      </Box>
    </Box>
  );
};

export default CommentItem;
