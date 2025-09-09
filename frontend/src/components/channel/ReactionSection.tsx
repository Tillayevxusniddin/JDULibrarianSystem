import React, { useState, useEffect, useMemo } from 'react';
import { Box, Chip, IconButton, Popover, Typography } from '@mui/material';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import { useAuthStore } from '../../store/auth.store';
import type { Post } from '../../types';
import { socket } from '../../api/socket';
import api from '../../api';

interface ReactionSectionProps {
  post: Post;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ReactionSection: React.FC<ReactionSectionProps> = ({ post }) => {
  const { user } = useAuthStore();
  const [reactions, setReactions] = useState(post.reactions || []);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    socket.emit('joinPostReactions', post.id);

    const handleReactionsUpdated = ({ postId }: { postId: string }) => {
      if (postId === post.id) {
        // Eng ishonchli yechim: post ma'lumotlarini to'liq qayta so'rab olish
        api.get(`/posts/channel/${post.channelId}`).then(res => {
            const updatedPost = res.data.data.find((p: Post) => p.id === post.id);
            if (updatedPost) {
                setReactions(updatedPost.reactions);
            }
        });
      }
    };

    socket.on('reactions_updated', handleReactionsUpdated);

    return () => {
      socket.emit('leavePostReactions', post.id);
      socket.off('reactions_updated', handleReactionsUpdated);
    };
  }, [post.id, post.channelId]);

  const handleEmojiClick = (emoji: string) => {
    // Optimistik yangilanish
    const myCurrentReaction = reactions.find(r => r.userId === user?.id);
    let newReactions = [...reactions];

    if (myCurrentReaction) {
        newReactions = newReactions.filter(r => r.userId !== user?.id);
        if (myCurrentReaction.emoji !== emoji) {
            newReactions.push({ emoji, userId: user!.id });
        }
    } else {
        newReactions.push({ emoji, userId: user!.id });
    }
    setReactions(newReactions);

    api.post(`/reactions/${post.id}`, { emoji });
    setAnchorEl(null);
  };

  const myReaction = useMemo(() => {
    return reactions.find(r => r.userId === user?.id)?.emoji;
  }, [reactions, user]);

  const reactionGroups = useMemo(() => {
    return reactions.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [reactions]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 1 }}>
      {Object.entries(reactionGroups).map(([emoji, count]) => (
        <Chip
          key={emoji}
          label={`${emoji} ${count}`}
          onClick={() => handleEmojiClick(emoji)}
          variant={myReaction === emoji ? 'filled' : 'outlined'}
          color={myReaction === emoji ? 'primary' : 'default'}
          size="small"
          sx={{
            borderRadius: 2,
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: (theme) => theme.shadows[2],
            },
            ...(myReaction === emoji && {
              background: 'linear-gradient(45deg, #3B82F6, #8B5CF6)',
              color: 'white',
              border: 'none',
            }),
          }}
        />
      ))}
      <IconButton 
        size="small" 
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          ml: 0.5,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: 'primary.light',
            transform: 'rotate(180deg)',
          }
        }}
      >
        <AddReactionIcon fontSize="small" />
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: (theme) => theme.shadows[8],
          }
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {EMOJI_OPTIONS.map(emoji => (
            <IconButton 
              key={emoji} 
              onClick={() => handleEmojiClick(emoji)}
              sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.3)',
                  bgcolor: 'primary.light',
                }
              }}
            >
              <Typography sx={{ fontSize: '1.5rem' }}>{emoji}</Typography>
            </IconButton>
          ))}
        </Box>
      </Popover>
    </Box>
  );
};

export default ReactionSection;
