import React from 'react';
import { Box, Typography, Avatar, Button, Paper } from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';
import { useAuthStore } from '../../store/auth.store';
import type { PostComment } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';

interface CommentItemProps {
  comment: PostComment;
  allComments: PostComment[];
  onReply: (comment: PostComment) => void;
  onDelete: (commentId: string) => void;
  onScrollToComment: (commentId: string) => void; // <<< XATOLIK TUZATILDI: Prop qo'shildi
  channelOwnerId?: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, allComments, onReply, onDelete, onScrollToComment, channelOwnerId }) => {
  const { user } = useAuthStore();
  const isOwnComment = user?.id === comment.user.id;
  const canDelete = isOwnComment || user?.id === channelOwnerId;
  const avatarUrl = comment.user.profilePicture ? `http://localhost:5000${comment.user.profilePicture}` : undefined;

  // Rekursiv funksiya yordamida ota-ona izohni topamiz
  const findCommentById = (comments: PostComment[], id: string): PostComment | null => {
    for (const c of comments) {
      if (c.id === id) return c;
      if (c.replies) {
        const found = findCommentById(c.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  const parentComment = comment.parentId ? findCommentById(allComments, comment.parentId) : null;

  return (
    <Box sx={{ width: '100%' }} id={`comment-${comment.id}`}>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Avatar src={avatarUrl} sx={{ width: 40, height: 40, mt: 0.5 }}>
          {comment.user.firstName.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: isOwnComment ? 'primary.main' : 'text.primary' }}>
              {comment.user.firstName} {comment.user.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: uz })}
            </Typography>
          </Box>
          
          {/* --- TELEGRAM-SIMON REPLY BLOKI --- */}
          {parentComment && (
            <Paper
              elevation={0}
              onClick={() => onScrollToComment(parentComment.id)}
              sx={{
                mt: 1, p: 1.5, bgcolor: 'action.hover', borderLeft: '3px solid',
                borderColor: 'primary.main', borderRadius: 1, cursor: 'pointer',
                transition: 'background-color 0.2s', '&:hover': { bgcolor: 'action.selected' }
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {parentComment.user.firstName} {parentComment.user.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {parentComment.content}
              </Typography>
            </Paper>
          )}

          <Typography variant="body2" sx={{ py: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {comment.content}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button size="small" startIcon={<ReplyIcon />} onClick={() => onReply(comment)} sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 'normal' }}>
              Javob
            </Button>
            {canDelete && (
              <Button size="small" onClick={() => onDelete(comment.id)} sx={{ textTransform: 'none', color: 'error.main', fontWeight: 'normal' }}>
                O'chirish
              </Button>
            )}
          </Box>

          {/* Rekursiv javoblar */}
          {comment.replies?.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              allComments={allComments}
              onReply={onReply}
              onDelete={onDelete}
              onScrollToComment={onScrollToComment}
              channelOwnerId={channelOwnerId}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default CommentItem;

